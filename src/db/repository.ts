import { sqlDb } from './index.ts';
import { users, creatorProfiles, campaigns, contributions, paymentAccounts, payouts, ledgerEntries, notifications } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

/**
 * User & Profile queries
 */
export async function getPostgresUserByUid(uid: string) {
  try {
    const res = await sqlDb.select().from(users).where(eq(users.uid, uid)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Database query failed for getPostgresUserByUid:', error);
    throw new Error('Failed to retrieve user record.', { cause: error });
  }
}

export async function upsertPostgresUser(data: {
  uid: string;
  email: string;
  fullName?: string;
  username?: string;
  role?: string;
}) {
  try {
    const res = await sqlDb
      .insert(users)
      .values({
        uid: data.uid,
        email: data.email,
        fullName: data.fullName,
        username: data.username,
        role: data.role || 'creator',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email,
          fullName: data.fullName,
          username: data.username,
          updatedAt: new Date(),
        },
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database upsert failed for upsertPostgresUser:', error);
    throw new Error('Failed to save user record.', { cause: error });
  }
}

export async function getPostgresCreatorByUsername(username: string) {
  try {
    const clean = username.toLowerCase().replace(/^@/, '');
    const res = await sqlDb.select().from(creatorProfiles).where(eq(creatorProfiles.username, clean)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Database query failed for getPostgresCreatorByUsername:', error);
    throw new Error('Failed to retrieve creator profile.', { cause: error });
  }
}

export async function getPostgresCreatorByUserId(userId: string) {
  try {
    const res = await sqlDb.select().from(creatorProfiles).where(eq(creatorProfiles.userId, userId)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Database query failed for getPostgresCreatorByUserId:', error);
    throw new Error('Failed to retrieve creator profile by ID.', { cause: error });
  }
}

export async function upsertPostgresCreatorProfile(data: {
  userId: string;
  displayName: string;
  username: string;
  biography?: string;
  category?: string;
  profileImage?: string;
  coverImage?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  supportButtonText?: string;
  suggestedAmounts?: number[];
  theme?: string;
  published?: boolean;
}) {
  try {
    const cleanUsername = data.username.toLowerCase().replace(/^@/, '');
    const res = await sqlDb
      .insert(creatorProfiles)
      .values({
        userId: data.userId,
        displayName: data.displayName,
        username: cleanUsername,
        biography: data.biography || '',
        category: data.category || 'Creative & Tech',
        profileImage: data.profileImage || '',
        coverImage: data.coverImage || '',
        website: data.website || '',
        socialLinks: data.socialLinks || {},
        supportButtonText: data.supportButtonText || 'Buy me data 📶',
        suggestedAmounts: data.suggestedAmounts || [500, 1000, 2000, 5000],
        theme: data.theme || 'crimson',
        published: data.published ?? true,
      })
      .onConflictDoUpdate({
        target: creatorProfiles.userId,
        set: {
          displayName: data.displayName,
          username: cleanUsername,
          biography: data.biography,
          category: data.category,
          profileImage: data.profileImage,
          coverImage: data.coverImage,
          website: data.website,
          socialLinks: data.socialLinks,
          supportButtonText: data.supportButtonText,
          suggestedAmounts: data.suggestedAmounts,
          theme: data.theme,
          published: data.published,
          updatedAt: new Date(),
        },
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database upsert failed for upsertPostgresCreatorProfile:', error);
    throw new Error('Failed to save creator profile.', { cause: error });
  }
}

/**
 * Campaigns
 */
export async function getPostgresCampaignsByCreator(creatorId: string) {
  try {
    return await sqlDb
      .select()
      .from(campaigns)
      .where(eq(campaigns.creatorId, creatorId))
      .orderBy(desc(campaigns.createdAt));
  } catch (error) {
    console.error('Database query failed for getPostgresCampaignsByCreator:', error);
    throw new Error('Failed to retrieve campaigns.', { cause: error });
  }
}

export async function getPostgresCampaignBySlug(slug: string) {
  try {
    const res = await sqlDb.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Database query failed for getPostgresCampaignBySlug:', error);
    throw new Error('Failed to retrieve campaign.', { cause: error });
  }
}

/**
 * Contributions & Financials
 */
export async function getPostgresContributionsByCreator(creatorId: string) {
  try {
    return await sqlDb
      .select()
      .from(contributions)
      .where(eq(contributions.creatorId, creatorId))
      .orderBy(desc(contributions.createdAt));
  } catch (error) {
    console.error('Database query failed for getPostgresContributionsByCreator:', error);
    throw new Error('Failed to retrieve contributions.', { cause: error });
  }
}

export async function recordPostgresContribution(data: typeof contributions.$inferInsert) {
  try {
    const res = await sqlDb.insert(contributions).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('Database insert failed for recordPostgresContribution:', error);
    throw new Error('Failed to record contribution.', { cause: error });
  }
}
