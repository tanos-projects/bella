import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CountryDocument = Country & Document;

@Schema({ autoIndex: true })
export class Country {
  @Prop({ required: true, index: true, unique: true, immutable: true })
  id: string;
  @Prop({ required: true, unique: true })
  name: string;
  @Prop({ required: true, index: true, unique: true })
  iso2: string;
  @Prop({ required: true })
  phoneCode: string;
  @Prop({ required: true })
  currency: string;
  @Prop()
  flag: string;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
CountrySchema.index({ id: 1 }, { unique: true });
