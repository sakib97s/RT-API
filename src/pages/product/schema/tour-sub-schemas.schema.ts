import { Schema } from 'mongoose';

export const ParticipantTypeSchema = new Schema(
  {
    participantName: { type: String, required: false },
    ageFrom: { type: Number, required: false },
    ageTo: { type: Number, required: false },
    basePrice: { type: Number, required: false },
    salePrice: { type: Number, required: false },
    tax: { type: Number, required: false, default: 0 },
    maxQuantity: { type: Number, required: false },
    minQuantity: { type: Number, required: false, default: 0 },
    capacity: { type: Number, required: false },
    remainingSeat: { type: Number, required: false },
    color: { type: String, required: false },
    defaultSelected: { type: Boolean, required: false, default: false },
  },
  { _id: true, timestamps: false }
);

export const LocationSchema = new Schema(
  {
    title: { type: String, required: false },
    address: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    googleMapUrl: { type: String, required: false },
    instructions: { type: String, required: false },
    image: { type: String, required: false },
    primaryMeetingPoint: { type: Boolean, required: false, default: false },
    pickupAvailable: { type: Boolean, required: false, default: false },
    dropoffAvailable: { type: Boolean, required: false, default: false },
    sortOrder: { type: Number, required: false, default: 0 },
  },
  { _id: true, timestamps: false }
);

export const LanguageItemSchema = new Schema(
  {
    language: { type: String, required: false },
    audioGuide: { type: Boolean, required: false, default: false },
    liveGuide: { type: Boolean, required: false, default: false },
    included: { type: Boolean, required: false, default: false },
  },
  { _id: true, timestamps: false }
);

export const HighlightSchema = new Schema(
  {
    icon: { type: String, required: false },
    image: { type: String, required: false },
    title: { type: String, required: false },
    subtitle: { type: String, required: false },
    description: { type: String, required: false },
    sortOrder: { type: Number, required: false, default: 0 },
  },
  { _id: true, timestamps: false }
);

export const IncludeExcludeSchema = new Schema(
  {
    icon: { type: String, required: false },
    title: { type: String, required: false },
    description: { type: String, required: false },
    sortOrder: { type: Number, required: false, default: 0 },
  },
  { _id: true, timestamps: false }
);

export const TextItemSchema = new Schema(
  {
    title: { type: String, required: false },
    description: { type: String, required: false },
    text: { type: String, required: false },
    warning: { type: Boolean, required: false, default: false },
    priority: { type: Number, required: false, default: 0 },
    icon: { type: String, required: false },
    sortOrder: { type: Number, required: false, default: 0 },
  },
  { _id: true, timestamps: false }
);

export const FAQSchema = new Schema(
  {
    question: { type: String, required: false },
    answer: { type: String, required: false },
    sortOrder: { type: Number, required: false, default: 0 },
    expanded: { type: Boolean, required: false, default: false },
  },
  { _id: true, timestamps: false }
);

export const TimeSlotSchema = new Schema(
  {
    startTime: { type: String, required: false },
    endTime: { type: String, required: false },
    duration: { type: String, required: false },
    capacity: { type: Number, required: false },
    maximumCapacity: { type: Number, required: false },
    remainingCapacity: { type: Number, required: false },
    adultPrice: { type: Number, required: false },
    childPrice: { type: Number, required: false },
    infantPrice: { type: Number, required: false },
    priceOverride: { type: Number, required: false },
    guideName: { type: String, required: false },
    status: { type: String, required: false, default: 'Available' },
    bookingCutoff: { type: String, required: false },
    bookingLimit: { type: Number, required: false },
    color: { type: String, required: false },
  },
  { _id: true, timestamps: false }
);

export const BookingDateSchema = new Schema(
  {
    date: { type: Date, required: false },
    dateString: { type: String, required: false },
    status: { type: String, required: false, default: 'Available' },
    note: { type: String, required: false },
    timeSlots: { type: [TimeSlotSchema], required: false, default: [] },
  },
  { _id: true, timestamps: false }
);

export const ItineraryStopSchema = new Schema(
  {
    stopNumber: { type: Number, required: false },
    title: { type: String, required: false },
    stopName: { type: String, required: false },
    shortDescription: { type: String, required: false },
    fullDescription: { type: String, required: false },
    longDescription: { type: String, required: false },
    image: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    googleMapUrl: { type: String, required: false },
    arrivalTime: { type: String, required: false },
    departureTime: { type: String, required: false },
    duration: { type: String, required: false },
    sortOrder: { type: Number, required: false, default: 0 },
  },
  { _id: true, timestamps: false }
);

export const ExtraServiceSchema = new Schema(
  {
    serviceType: { type: String, required: false },
    title: { type: String, required: false },
    price: { type: Number, required: false },
    description: { type: String, required: false },
  },
  { _id: true, timestamps: false }
);

export const SeasonalDateSchema = new Schema(
  {
    name: { type: String, required: false },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    priceMultiplier: { type: Number, required: false, default: 1.0 },
  },
  { _id: true, timestamps: false }
);

export const RecurringDateSchema = new Schema(
  {
    frequency: { type: String, required: false },
    daysOfWeek: { type: [Number], required: false },
    recurringRule: { type: String, required: false },
  },
  { _id: true, timestamps: false }
);
