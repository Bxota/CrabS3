import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { secretId } = await request.json();

  if (!secretId || typeof secretId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid secret ID' }), { status: 400 });
  }

  try {
    const secret = await prisma.secrets.findUnique({
      where: { id: secretId },
      select: {
        password_hash: true,
        expires_at: true,
        view_count: true,
        max_views: true,
      },
    });
    if (!secret) {
      return new Response(JSON.stringify({ error: 'Secret not found' }), { status: 404 });
    }

    if (secret.expires_at! < new Date()) {
      return new Response(JSON.stringify({ error: 'Secret has expired' }), { status: 410 });
    }

    if (secret.view_count! >= secret.max_views!) {
      return new Response(JSON.stringify({ error: 'Secret has been viewed too many times' }), { status: 410 });
    }

    if (secret.password_hash) {
      return new Response(JSON.stringify({ requiresPassword: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ requiresPassword: false }), { status: 200 });
    }
  } catch (error) {
    console.error('Error checking secret:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
