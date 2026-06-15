import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const supportedTemplateTypes = ['EMAIL', 'IN_APP'] as const;

// GET /api/templates - Get all templates for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const messageType = searchParams.get('messageType');
    const isActive = searchParams.get('isActive');

    if (
      messageType &&
      !supportedTemplateTypes.includes(messageType as (typeof supportedTemplateTypes)[number])
    ) {
      return NextResponse.json(
        { error: 'SMS and WhatsApp are temporarily unavailable. Use Email or In-App.' },
        { status: 400 }
      );
    }

    const where = {
      userId: session.user.id,
      ...(category && { category }),
      ...(messageType && { messageType: messageType as 'EMAIL' | 'IN_APP' }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
    };

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.subject || !data.body) {
      return NextResponse.json({ error: 'Name, subject, and body are required' }, { status: 400 });
    }

    if (data.messageType && !supportedTemplateTypes.includes(data.messageType)) {
      return NextResponse.json(
        { error: 'SMS and WhatsApp are temporarily unavailable. Use Email or In-App.' },
        { status: 400 }
      );
    }

    // Extract variables from the template body (e.g., {{variableName}})
    const variableMatches = data.body.match(/\{\{(\w+)\}\}/g) || [];
    const variables: string[] = Array.from(
      new Set(variableMatches.map((v: string) => v.replace(/\{\{|\}\}/g, '')))
    );

    const template = await prisma.messageTemplate.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description || null,
        subject: data.subject,
        body: data.body,
        messageType: data.messageType || 'EMAIL',
        variables: variables,
        category: data.category || null,
        isActive: data.isActive !== false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
