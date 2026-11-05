import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { CreatorProfile, ThemePreset } from '../types';

export const DEFAULT_SUGGESTED_AMOUNTS = [500, 1000, 2000, 5000];

export async function checkUsernameAvailability(username: string, currentUserId?: string): Promise<boolean> {
  const clean = username.toLowerCase().trim();
  if (!clean || clean.length < 3) return false;
  
  // Forbidden reserved words
  const reserved = ['admin', 'dashboard', 'auth', 'login', 'register', 'checkout', 'api', 'help', 'about', 'terms', 'privacy', 'payouts'];
  if (reserved.includes(clean)) return false;

  try {
    const q = query(
      collection(db, 'creatorProfiles'),
      where('username', '==', clean),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return true;
    
    // If it exists, check if it belongs to the current user
    if (currentUserId) {
      const docData = snap.docs[0].data() as CreatorProfile;
      return docData.userId === currentUserId;
    }
    return false;
  } catch (err) {
    console.error('Error checking username:', err);
    return false;
  }
}

export async function getCreatorProfileByUsername(username: string): Promise<CreatorProfile | null> {
  const clean = username.toLowerCase().trim();
  try {
    const q = query(
      collection(db, 'creatorProfiles'),
      where('username', '==', clean),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as CreatorProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'creatorProfiles');
  }
}

export async function getCreatorProfileByUserId(userId: string): Promise<CreatorProfile | null> {
  try {
    // Check if doc exists with userId as doc ID first
    const directDoc = await getDoc(doc(db, 'creatorProfiles', userId));
    if (directDoc.exists()) {
      return { id: directDoc.id, ...directDoc.data() } as CreatorProfile;
    }

    // Otherwise query where userId matches
    const q = query(
      collection(db, 'creatorProfiles'),
      where('userId', '==', userId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as CreatorProfile;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch creator profile:', err);
    return null;
  }
}

export async function saveCreatorProfile(profile: Partial<CreatorProfile> & { userId: string }): Promise<CreatorProfile> {
  const docId = profile.id || profile.userId;
  const now = new Date().toISOString();

  const fullProfile: CreatorProfile = {
    id: docId,
    userId: profile.userId,
    displayName: profile.displayName || 'Creator',
    username: (profile.username || `creator_${Date.now()}`).toLowerCase().trim(),
    biography: profile.biography || '',
    profileImage: profile.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: profile.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    category: profile.category || 'Creative & Tech',
    website: profile.website || '',
    socialLinks: profile.socialLinks || {},
    supportButtonText: profile.supportButtonText || 'Buy me data',
    suggestedAmounts: profile.suggestedAmounts?.length ? profile.suggestedAmounts : DEFAULT_SUGGESTED_AMOUNTS,
    currencyPreference: profile.currencyPreference || 'NGN',
    theme: profile.theme || 'violet',
    publicSettings: profile.publicSettings || {
      showTotalRaised: true,
      showSupporterCount: true,
      showSupporterMessages: true,
      allowAnonymous: true,
    },
    published: profile.published ?? true,
    createdAt: profile.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'creatorProfiles', docId), fullProfile, { merge: true });
    return fullProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `creatorProfiles/${docId}`);
  }
}

/**
 * Seeds demo creators and campaigns if database is fresh so visitors immediately have
 * realistic creators and campaigns to view, support, and explore.
 */
export async function seedDemoDataIfEmpty(): Promise<void> {
  try {
    const existing = await getDocs(query(collection(db, 'creatorProfiles'), limit(1)));
    if (!existing.empty) return; // already has data

    const demoProfile: CreatorProfile = {
      id: 'demo_fola_tech',
      userId: 'demo_fola_uid',
      displayName: 'Fola Adebayo',
      username: 'folatech',
      biography: 'Software engineer, technical writer & mentor building open-source developer tools for African innovators. Creating tutorials on high-performance web systems and AI integration.',
      profileImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      category: 'Software & Technology',
      website: 'https://github.com/folatech',
      socialLinks: {
        twitter: 'https://twitter.com/folatech',
        github: 'https://github.com/folatech',
        linkedin: 'https://linkedin.com/in/folatech',
      },
      supportButtonText: 'Buy me data 📶',
      suggestedAmounts: [500, 1000, 2500, 5000],
      currencyPreference: 'NGN',
      theme: 'violet',
      publicSettings: {
        showTotalRaised: true,
        showSupporterCount: true,
        showSupporterMessages: true,
        allowAnonymous: true,
      },
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'creatorProfiles', 'demo_fola_tech'), demoProfile);

    // Also seed a demo campaign
    await setDoc(doc(db, 'campaigns', 'demo_campaign_1'), {
      id: 'demo_campaign_1',
      creatorId: 'demo_fola_uid',
      creatorUsername: 'folatech',
      creatorDisplayName: 'Fola Adebayo',
      creatorAvatar: demoProfile.profileImage,
      title: 'Solar Inverter & High-Speed Fiber Setup for Open Source Lab',
      slug: 'solar-inverter-open-source-lab',
      summary: 'Power stability is our biggest blocker in Lagos. Help us acquire a 3.5kVA lithium solar system and 100Mbps unlimited fiber connectivity to train 50 young open-source contributors.',
      description: `### Why We Need Your Support\n\nFrequent power outages disrupt our live coding workshops, video rendering, and server benchmarks. With your support, we are installing:\n\n1. **3.5kVA Hybrid Solar Inverter System** with 5kWh Lithium Phosphate battery storage.\n2. **Dedicated Starlink & Metro Fiber connection** for continuous livestreaming and workshops.\n3. **Scholarship funds** covering data bundles for 50 junior engineers across Nigeria participating in our 12-week fellowship.\n\nEvery contribution brings us closer to uninterrupted building and learning!`,
      coverImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
      category: 'Technology & Education',
      targetAmount: 850000,
      currency: 'NGN',
      amountRaised: 420000,
      contributorCount: 28,
      status: 'active',
      visibility: 'public',
      deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed sample public supporter message
    await setDoc(doc(db, 'contributions', 'demo_contrib_1'), {
      id: 'demo_contrib_1',
      creatorId: 'demo_fola_uid',
      creatorUsername: 'folatech',
      campaignId: 'demo_campaign_1',
      campaignTitle: 'Solar Inverter & High-Speed Fiber Setup for Open Source Lab',
      supporterName: 'Chidi Okafor',
      supporterEmail: 'chidi@example.com',
      amount: 15000,
      currency: 'NGN',
      message: 'Keep powering the next generation of African builders, Fola! Proud of what you do.',
      anonymous: false,
      publicMessage: true,
      paymentStatus: 'successful',
      platformFee: 750,
      netAmount: 14250,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });

    await setDoc(doc(db, 'contributions', 'demo_contrib_2'), {
      id: 'demo_contrib_2',
      creatorId: 'demo_fola_uid',
      creatorUsername: 'folatech',
      supporterName: 'Amaka D.',
      supporterEmail: 'amaka@example.com',
      amount: 5000,
      currency: 'NGN',
      message: 'Data on me for this week! Thanks for the insightful React tutorial.',
      anonymous: false,
      publicMessage: true,
      paymentStatus: 'successful',
      platformFee: 250,
      netAmount: 4750,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    });

    // Seed campaign update
    await setDoc(doc(db, 'campaignUpdates', 'demo_update_1'), {
      id: 'demo_update_1',
      campaignId: 'demo_campaign_1',
      creatorId: 'demo_fola_uid',
      title: 'Phase 1: Solar Rack mounts inspected & vendor selected',
      content: 'Huge thank you to our first 25 backers! We visited the vendor in Ikeja and confirmed the battery specs. We are already at nearly 50% of the goal!',
      images: ['https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=800&q=80'],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    });
  } catch (err) {
    console.warn('Demo seed skipped or encountered error:', err);
  }
}
