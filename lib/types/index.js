/**
 * Backend domain types (JSDoc) — CMS / admin ready.
 * No runtime coupling to UI or data/ JSON loaders.
 */

/**
 * @typedef {Object} SeoFields
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [image]
 */

/**
 * @typedef {Object} ProductColor
 * @property {string} [id]
 * @property {string} name
 * @property {string} [hex]
 * @property {boolean} [default]
 * @property {MediaRef[]} [gallery]
 */

/**
 * @typedef {Object} ProductSize
 * @property {string} size
 * @property {number} [stock]
 */

/**
 * @typedef {Object} MediaRef
 * @property {string} [id]
 * @property {string} src
 * @property {string} [alt]
 * @property {'image'|'video'|'svg'|string} [type]
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} [description]
 * @property {string|Object} [story]
 * @property {number|null} [price]
 * @property {number|null} [comparePrice]
 * @property {ProductColor[]} [colors]
 * @property {ProductSize[]|string[]} [sizes]
 * @property {MediaRef[]} [gallery]
 * @property {number} [stock]
 * @property {'draft'|'active'|'archived'|string} [status]
 * @property {SeoFields} [seo]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {MediaRef|string|null} [image]
 * @property {MediaRef|string|null} [banner]
 * @property {number} [order]
 * @property {boolean} [visibility]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} HomepageAnnouncement
 * @property {boolean} [enabled]
 * @property {string} [text]
 * @property {string} [href]
 */

/**
 * @typedef {Object} HomepageDocument
 * @property {string} id
 * @property {Object} [hero]
 * @property {Object[]} [collections]
 * @property {string[]} [featuredProductIds]
 * @property {Object} [whyBeyond]
 * @property {Object} [footer]
 * @property {HomepageAnnouncement} [announcement]
 * @property {Object} [headings]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} ThemeDocument
 * @property {string} id
 * @property {Object} [dark]
 * @property {Object} [light]
 * @property {Object} [typography]
 * @property {Object} [buttons]
 * @property {Object} [spacing]
 * @property {Object} [animation]
 * @property {Object} [logo]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} NavigationDocument
 * @property {string} id
 * @property {Object} [desktopMenu]
 * @property {Object} [mobileMenu]
 * @property {Object[]} [footerMenu]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} SettingsDocument
 * @property {string} id
 * @property {string} [brandName]
 * @property {string} [currency]
 * @property {string} [locale]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {Object.<string, any>} [meta]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [fullName]
 * @property {Object[]} [addresses]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} Coupon
 * @property {string} id
 * @property {string} code
 * @property {'percent'|'fixed'|string} [type]
 * @property {number} [value]
 * @property {boolean} [active]
 * @property {string} [startsAt]
 * @property {string} [endsAt]
 * @property {number} [minSubtotal]
 * @property {number} [usageLimit]
 * @property {number} [usedCount]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} productId
 * @property {string} [slug]
 * @property {string} name
 * @property {string} [color]
 * @property {string} [size]
 * @property {number} quantity
 * @property {number|null} [unitPrice]
 * @property {string} [image]
 */

/**
 * @typedef {Object} OrderAddress
 * @property {string} [fullName]
 * @property {string} [line1]
 * @property {string} [line2]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [postalCode]
 * @property {string} [country]
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} [number]
 * @property {string} [customerId]
 * @property {OrderItem[]} items
 * @property {OrderAddress} [shippingAddress]
 * @property {OrderAddress} [billingAddress]
 * @property {Object} [totals]
 * @property {'pending'|'paid'|'failed'|'refunded'|string} [paymentStatus]
 * @property {'pending'|'processing'|'shipped'|'delivered'|'cancelled'|string} [shippingStatus]
 * @property {string} [tracking]
 * @property {string} [courier]
 * @property {string} [couponCode]
 * @property {string} [notes]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} MediaAsset
 * @property {string} id
 * @property {string} src
 * @property {string} [alt]
 * @property {string} [filename]
 * @property {string} [mimeType]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [size]
 * @property {'image'|'video'|'svg'|string} [type]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} ListQuery
 * @property {number} [limit]
 * @property {number} [offset]
 * @property {string} [sortBy]
 * @property {'asc'|'desc'} [sortDir]
 * @property {Object.<string, any>} [filter]
 */

/**
 * @typedef {Object} ListResult
 * @property {Object[]} items
 * @property {number} total
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @typedef {Object} CollectionPort
 * @property {(query?: ListQuery) => Promise<ListResult>} findMany
 * @property {(id: string) => Promise<Object|null>} findById
 * @property {(filter: Object) => Promise<Object|null>} findOne
 * @property {(data: Object) => Promise<Object>} insert
 * @property {(id: string, patch: Object) => Promise<Object|null>} update
 * @property {(id: string) => Promise<boolean>} remove
 */

/**
 * @typedef {Object} DatabaseAdapter
 * @property {(name: string) => CollectionPort} collection
 * @property {() => Promise<void>} [connect]
 * @property {() => Promise<void>} [disconnect]
 * @property {string} provider
 */

export {};
