import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ autoIndex: true })
export class Category {
  @Prop({ required: true, index: true, unique: true, immutable: true })
  id: string;
  @Prop({ required: true, unique: true })
  code: string;
  @Prop({ required: true })
  label: string;
  @Prop()
  description: string;
  @Prop()
  top: boolean;
  @Prop()
  selectable: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ id: 1 }, { unique: true });
