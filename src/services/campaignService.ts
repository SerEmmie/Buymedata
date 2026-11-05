import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Campaign, CampaignUpdate, CampaignStatus, Contribution } from '../types';
import { slugify } from '../utils/formatters';

export async function createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'amountRaised' | 'contributorCount'>): Promise<Campaign> {
  const id = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  
  const baseSlug = slugify(campaignData.title);
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  const newCampaign: Campaign = {
    ...campaignData,
    id,
    slug: campaignData.slug || slug,
    amountRaised: 0,
    contributorCount: 0,
    status: campaignData.status || 'active',
    currency: campaignData.currency || 'NGN',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'campaigns', id), newCampaign);
    return newCampaign;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `campaigns/${id}`);
  }
}

export async function updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<void> {
  try {
    await updateDoc(doc(db, 'campaigns', campaignId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `campaigns/${campaignId}`);
  }
}

export async function setCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'campaigns', campaignId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `campaigns/${campaignId}`);
  }
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'campaigns', campaignId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `campaigns/${campaignId}`);
  }
}

export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  try {
    const snap = await getDoc(doc(db, 'campaigns', campaignId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Campaign;
    }
    return null;
  } catch (err) {
    console.error('Error fetching campaign:', err);
    return null;
  }
}

export async function getCampaignBySlug(creatorUsername: string, slug: string): Promise<Campaign | null> {
  try {
    const q = query(
      collection(db, 'campaigns'),
      where('creatorUsername', '==', creatorUsername.toLowerCase().trim()),
      where('slug', '==', slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Campaign;
    }
    return null;
  } catch (err) {
    console.error('Error fetching campaign by slug:', err);
    return null;
  }
}

export async function getCreatorCampaigns(creatorId: string): Promise<Campaign[]> {
  try {
    const q = query(
      collection(db, 'campaigns'),
      where('creatorId', '==', creatorId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
  } catch (err) {
    console.error('Error getting creator campaigns:', err);
    return [];
  }
}

export async function getPublicCampaigns(): Promise<Campaign[]> {
  try {
    const q = query(
      collection(db, 'campaigns'),
      where('status', '==', 'active'),
      limit(12)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
  } catch (err) {
    console.error('Error getting public campaigns:', err);
    return [];
  }
}

/**
 * Fetches all verified contributions for a campaign and calculates genuine verified progress.
 * Guarantees that progress reflects confirmed payments in the database.
 */
export async function getCampaignVerifiedProgress(campaignId: string): Promise<{
  verifiedAmount: number;
  contributorCount: number;
  contributions: Contribution[];
}> {
  try {
    const q = query(
      collection(db, 'contributions'),
      where('campaignId', '==', campaignId)
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contribution));
    const successful = all.filter((c) => c.paymentStatus === 'successful');
    
    const verifiedAmount = successful.reduce((sum, c) => sum + (c.amount || 0), 0);
    const contributorCount = successful.length;

    return {
      verifiedAmount,
      contributorCount,
      contributions: successful.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  } catch (err) {
    console.error('Error computing verified campaign progress:', err);
    return { verifiedAmount: 0, contributorCount: 0, contributions: [] };
  }
}

export async function addCampaignUpdate(
  campaignId: string,
  creatorId: string,
  title: string,
  content: string,
  images: string[] = []
): Promise<CampaignUpdate> {
  const id = `upd_${Date.now()}`;
  const newUpdate: CampaignUpdate = {
    id,
    campaignId,
    creatorId,
    title,
    content,
    images,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'campaignUpdates', id), newUpdate);
    return newUpdate;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `campaignUpdates/${id}`);
  }
}

export async function deleteCampaignUpdate(updateId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'campaignUpdates', updateId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `campaignUpdates/${updateId}`);
  }
}

export async function getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]> {
  try {
    const q = query(
      collection(db, 'campaignUpdates'),
      where('campaignId', '==', campaignId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampaignUpdate));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error getting campaign updates:', err);
    return [];
  }
}
