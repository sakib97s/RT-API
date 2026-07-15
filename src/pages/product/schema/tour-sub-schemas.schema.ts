import { Schema } from 'mongoose';

export const LocationSchema = new Schema(
  {
    title: { type: String, required: false },
    address: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    googleMapUrl: { type: String, required: false },
    sortOrder: { type: Number, required: false },
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
    sortOrder: { type: Number, required: false },
  },
  { _id: true, timestamps: false }
);

export const IncludeExcludeSchema = new Schema(
  {
    icon: { type: String, required: false },
    title: { type: String, required: false },
    sortOrder: { type: Number, required: false },
  },
  { _id: true, timestamps: false }
);

export const TextItemSchema = new Schema(
  {
    text: { type: String, required: false },
    sortOrder: { type: Number, required: false },
  },
  { _id: true, timestamps: false }
);

export const FAQSchema = new Schema(
  {
    question: { type: String, required: false },
    answer: { type: String, required: false },
    sortOrder: { type: Number, required: false },
    expanded: { type: Boolean, required: false, default: false },
  },
  { _id: true, timestamps: false }
);

export const TimeSlotSchema = new Schema(
  {
    startTime: { type: String, required: false },
    endTime: { type: String, required: false },
    maximumCapacity: { type: Number, required: false },
    remainingCapacity: { type: Number, required: false },
  },
  { _id: true, timestamps: false }
);

export const ItineraryStopSchema = new Schema(
  {
    stopNumber: { type: Number, required: false },
    stopName: { type: String, required: false },
    shortDescription: { type: String, required: false },
    longDescription: { type: String, required: false },
    image: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    googleMapUrl: { type: String, required: false },
    arrivalTime: { type: String, required: false },
    departureTime: { type: String, required: false },
    duration: { type: String, required: false },
    sortOrder: { type: Number, required: false },
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
