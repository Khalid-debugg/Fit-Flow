import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebase-admin';
import { userConverter } from '@/models/user';
import type { CreateUserInput, User } from '@/models/user';
import { USERS_COLLECTION } from '@/constants/common';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, role }: CreateUserInput = body;

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Set custom claims for role-based access
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role,
    });

    // Create user document in Firestore
    const userInput: User = {
      id: userRecord.uid,
      email,
      name,
      phone,
      role,
      createdAt: new Date(),
    };

    await adminDb
      .collection(USERS_COLLECTION)
      .doc(userRecord.uid)
      .withConverter(userConverter)
      .set(userInput);

    // Generate custom token
    const customToken = await adminAuth.createCustomToken(userRecord.uid, {
      role,
    });

    return NextResponse.json({
      success: true,
      token: customToken,
      user: {
        uid: userRecord.uid,
        email,
        name,
        role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
