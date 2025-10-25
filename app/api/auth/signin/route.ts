// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebase-admin';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase-client';
import { USERS_COLLECTION } from '@/constants/common';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    const userDoc = await adminDb
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const role = userData?.role;

    // Update custom claims
    await adminAuth.setCustomUserClaims(user.uid, {
      role,
    });

    // Generate custom token with claims
    const customToken = await adminAuth.createCustomToken(user.uid, {
      role,
    });

    return NextResponse.json({
      success: true,
      token: customToken,
      user: {
        uid: user.uid,
        email: user.email,
        name: userData?.name,
        role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 401 }
    );
  }
}
