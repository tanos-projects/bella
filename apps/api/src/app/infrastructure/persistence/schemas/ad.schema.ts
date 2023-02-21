import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { AdImage, AdStatus, ContactSetting } from '@bella/api/domain';
import { User } from './user.schema';

export type AdDocument = Ad & mongoose.Document;

@Schema({
  autoIndex: true,
  timestamps: true,
})
export class Ad {
  @Prop({ required: true })
  category: string;
  @Prop()
  country: string;
  @Prop()
  city: string;
  @Prop()
  currency: string;
  @Prop({ required: true })
  description: string;
  @Prop()
  images?: AdImage[];
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  owner?: User;
  @Prop()
  price: number;
  @Prop()
  quality: string;
  @Prop({
    type: String,
    required: true,
    enum: Object.keys(AdStatus)
  })
  status: string;
  @Prop({ required: true })
  title: string;
  @Prop()
  contactSettings?: ContactSetting;
  @Prop()
  approbationMessage?: string;
  @Prop({ default: Date.now })
  createdAt?: Date;
  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const AdSchema = SchemaFactory.createForClass(Ad);
AdSchema.index({ title: 'text', description: 'text', city: 'text' });
