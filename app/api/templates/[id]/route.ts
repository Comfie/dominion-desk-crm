import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/templates/[id] - Get a single template
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.messageTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Extract variables from the template body if body is being updated
    let variables: string[] | null = existingTemplate.variables as string[] | null;
    if (data.body) {
      const variableMatches = data.body.match(/\{\{(\w+)\}\}/g) || [];
      const extractedVars: string[] = Array.from(
        new Set(variableMatches.map((v: string) => v.replace(/\{\{|\}\}/g, '')))
      );
      variables = extractedVars.length > 0 ? extractedVars : null;
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        subject: data.subject,
        body: data.body,
        messageType: data.messageType,
        variables: variables === null ? Prisma.JsonNull : variables,
        category: data.category,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.messageTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
