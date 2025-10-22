import { relations } from 'drizzle-orm/relations';
import {
  users,
  accounts,
  appointments,
  customerProfiles,
  customerInteractions,
  customerTags,
  customerTagAssignments,
  orders,
  products,
  reviews,
  sessions,
  customerAddresses,
  customerNotificationPreferences,
  customerPaymentMethods,
  customerRecentlyViewed,
  customerReviews,
  customerWishlists,
  userSecurity,
  productCategories,
  postCategories,
  posts,
} from './schema';

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  appointments: many(appointments),
  customerProfiles: many(customerProfiles),
  orders: many(orders),
  sessions: many(sessions),
  customerAddresses: many(customerAddresses),
  customerNotificationPreferences: many(customerNotificationPreferences),
  customerPaymentMethods: many(customerPaymentMethods),
  customerRecentlyVieweds: many(customerRecentlyViewed),
  customerReviews: many(customerReviews),
  customerWishlists: many(customerWishlists),
  userSecurities: many(userSecurity),
  posts: many(posts),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
}));

export const customerInteractionsRelations = relations(customerInteractions, ({ one }) => ({
  customerProfile: one(customerProfiles, {
    fields: [customerInteractions.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one, many }) => ({
  customerInteractions: many(customerInteractions),
  user: one(users, {
    fields: [customerProfiles.userId],
    references: [users.id],
  }),
  customerTagAssignments: many(customerTagAssignments),
}));

export const customerTagAssignmentsRelations = relations(customerTagAssignments, ({ one }) => ({
  customerTag: one(customerTags, {
    fields: [customerTagAssignments.customerTagId],
    references: [customerTags.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [customerTagAssignments.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

export const customerTagsRelations = relations(customerTags, ({ many }) => ({
  customerTagAssignments: many(customerTagAssignments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  customerReviews: many(customerReviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  reviews: many(reviews),
  customerRecentlyVieweds: many(customerRecentlyViewed),
  customerReviews: many(customerReviews),
  customerWishlists: many(customerWishlists),
  productCategory: one(productCategories, {
    fields: [products.category],
    references: [productCategories.slug],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  user: one(users, {
    fields: [customerAddresses.userId],
    references: [users.id],
  }),
}));

export const customerNotificationPreferencesRelations = relations(
  customerNotificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [customerNotificationPreferences.userId],
      references: [users.id],
    }),
  })
);

export const customerPaymentMethodsRelations = relations(customerPaymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [customerPaymentMethods.userId],
    references: [users.id],
  }),
}));

export const customerRecentlyViewedRelations = relations(customerRecentlyViewed, ({ one }) => ({
  product: one(products, {
    fields: [customerRecentlyViewed.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [customerRecentlyViewed.userId],
    references: [users.id],
  }),
}));

export const customerReviewsRelations = relations(customerReviews, ({ one }) => ({
  order: one(orders, {
    fields: [customerReviews.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [customerReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [customerReviews.userId],
    references: [users.id],
  }),
}));

export const customerWishlistsRelations = relations(customerWishlists, ({ one }) => ({
  product: one(products, {
    fields: [customerWishlists.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [customerWishlists.userId],
    references: [users.id],
  }),
}));

export const userSecurityRelations = relations(userSecurity, ({ one }) => ({
  user: one(users, {
    fields: [userSecurity.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  postCategory: one(postCategories, {
    fields: [posts.categoryId],
    references: [postCategories.id],
  }),
  user: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const postCategoriesRelations = relations(postCategories, ({ many }) => ({
  posts: many(posts),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));
