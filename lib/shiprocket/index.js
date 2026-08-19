/**
 * Shiprocket API Service
 * Handles authentication, order creation, label generation, tracking, pickup scheduling, and webhooks.
 */

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

class ShiprocketError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = "ShiprocketError";
    this.statusCode = statusCode;
    this.response = response;
  }
}

class ShiprocketService {
  constructor() {
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.pickupLocationId = process.env.SHIPROCKET_PICKUP_LOCATION_ID;
    this.webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    this.enabled = process.env.SHIPROCKET_ENABLED === "true";

    this.token = null;
    this.tokenExpiry = 0;
  }

  isEnabled() {
    return this.enabled && this.email && this.password;
  }

  async getToken() {
    if (this.token && Date.now() < this.tokenExpiry - 60000) {
      return this.token;
    }

    if (!this.email || !this.password) {
      throw new ShiprocketError("Shiprocket credentials not configured", 500);
    }

    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ShiprocketError(
        data.message || "Authentication failed",
        response.status,
        data
      );
    }

    this.token = data.token;
    this.tokenExpiry = Date.now() + 10 * 24 * 60 * 60 * 1000;

    return this.token;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ShiprocketError(
        data.message || `Shiprocket API error: ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  }

  async createOrder(orderData) {
    const payload = {
      order_id: orderData.orderId,
      order_date: orderData.orderDate || new Date().toISOString().split("T")[0],
      pickup_location: this.pickupLocationId,
      billing_customer_name: orderData.billingCustomerName,
      billing_last_name: orderData.billingLastName || "",
      billing_address: orderData.billingAddress,
      billing_address_2: orderData.billingAddress2 || "",
      billing_city: orderData.billingCity,
      billing_pincode: orderData.billingPincode,
      billing_state: orderData.billingState,
      billing_country: orderData.billingCountry || "India",
      billing_email: orderData.billingEmail,
      billing_phone: orderData.billingPhone,
      shipping_is_billing: orderData.shippingIsBilling ?? true,
      shipping_customer_name: orderData.shippingCustomerName,
      shipping_last_name: orderData.shippingLastName || "",
      shipping_address: orderData.shippingAddress,
      shipping_address_2: orderData.shippingAddress2 || "",
      shipping_city: orderData.shippingCity,
      shipping_pincode: orderData.shippingPincode,
      shipping_state: orderData.shippingState,
      shipping_country: orderData.shippingCountry || "India",
      shipping_email: orderData.shippingEmail,
      shipping_phone: orderData.shippingPhone,
      order_items: orderData.orderItems,
      payment_method: orderData.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: orderData.subTotal,
      length: orderData.length || 10,
      breadth: orderData.breadth || 10,
      height: orderData.height || 5,
      weight: orderData.weight || 0.5,
    };

    if (orderData.paymentMethod === "cod") {
      payload.payment_method = "COD";
      payload.cod_amount = orderData.total;
    }

    return this.request("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createShipment(shipmentData) {
    return this.request("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: shipmentData.shipmentId,
        courier_id: shipmentData.courierId,
      }),
    });
  }

  async generateLabel(shipmentId) {
    return this.request(`/courier/generate/label?shipment_id=${shipmentId}`, {
      method: "GET",
    });
  }

  async generateManifest(shipmentIds) {
    return this.request("/courier/generate/manifest", {
      method: "POST",
      body: JSON.stringify({ shipment_id: shipmentIds }),
    });
  }

  async trackShipment(awbCode) {
    return this.request(`/courier/track/awb/${awbCode}`, {
      method: "GET",
    });
  }

  async schedulePickup(pickupData) {
    return this.request("/courier/schedule/pickup", {
      method: "POST",
      body: JSON.stringify({
        pickup_location: this.pickupLocationId,
        shipment_id: pickupData.shipmentId,
        pickup_date: pickupData.pickupDate,
        pickup_time_slot: pickupData.pickupTimeSlot,
      }),
    });
  }

  async cancelShipment(shipmentId, reason = "Order cancelled by customer") {
    return this.request(`/orders/cancel`, {
      method: "POST",
      body: JSON.stringify({ ids: [shipmentId], reason }),
    });
  }

  async getCouriers(pincode, weight = 0.5, cod = false) {
    return this.request(
      `/courier/serviceability/?pickup_postcode=${this.getPickupPincode()}&delivery_postcode=${pincode}&weight=${weight}&cod=${cod ? 1 : 0}`,
      { method: "GET" }
    );
  }

  getPickupPincode() {
    return process.env.SHIPROCKET_PICKUP_PINCODE || "110001";
  }

  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn("Shiprocket webhook secret not configured");
      return false;
    }

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  }

  parseWebhookEvent(payload) {
    const event = payload.event;
    const data = payload.data;

    switch (event) {
      case "ORDER_CREATED":
        return {
          type: "order_created",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          awbCode: data.awb_code,
          courierName: data.courier_name,
          status: "created",
        };
      case "SHIPMENT_CREATED":
        return {
          type: "shipment_created",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          awbCode: data.awb_code,
          courierName: data.courier_name,
          status: "awb_assigned",
        };
      case "AWB_ASSIGNED":
        return {
          type: "awb_assigned",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          awbCode: data.awb_code,
          courierName: data.courier_name,
          status: "awb_assigned",
        };
      case "PICKUP_SCHEDULED":
        return {
          type: "pickup_scheduled",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          pickupDate: data.pickup_date,
          pickupToken: data.pickup_token,
          status: "pickup_scheduled",
        };
      case "PICKUP_COMPLETED":
        return {
          type: "pickup_completed",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          status: "picked_up",
        };
      case "SHIPPED":
        return {
          type: "shipped",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          awbCode: data.awb_code,
          courierName: data.courier_name,
          status: "shipped",
        };
      case "IN_TRANSIT":
        return {
          type: "in_transit",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          status: "in_transit",
        };
      case "OUT_FOR_DELIVERY":
        return {
          type: "out_for_delivery",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          status: "out_for_delivery",
        };
      case "DELIVERED":
        return {
          type: "delivered",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          deliveredAt: data.delivered_at,
          status: "delivered",
        };
      case "RTO_INITIATED":
        return {
          type: "rto_initiated",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          status: "rto_initiated",
        };
      case "RTO_DELIVERED":
        return {
          type: "rto_delivered",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          status: "rto_delivered",
        };
      case "LOST":
        return {
          type: "lost",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          status: "lost",
        };
      case "CANCELLED":
        return {
          type: "cancelled",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          status: "cancelled",
        };
      case "NDR":
        return {
          type: "ndr",
          orderId: data.order_id,
          shipmentId: data.shipment_id,
          ndrReason: data.reason,
          ndrAction: data.action,
          status: "ndr",
        };
      default:
        return {
          type: "unknown",
          event,
          rawData: data,
        };
    }
  }

  mapShiprocketStatusToInternal(shiprocketStatus) {
    const statusMap = {
      created: "processing",
      awb_assigned: "processing",
      pickup_scheduled: "processing",
      picked_up: "shipped",
      shipped: "shipped",
      in_transit: "shipped",
      out_for_delivery: "shipped",
      delivered: "delivered",
      rto_initiated: "shipped",
      rto_delivered: "delivered",
      lost: "cancelled",
      cancelled: "cancelled",
      ndr: "shipped",
    };
    return statusMap[shiprocketStatus] || "processing";
  }
}

export const shiprocket = new ShiprocketService();
export { ShiprocketError, ShiprocketService };