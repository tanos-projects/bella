import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type UserDocument = User & mongoose.Document;

@Schema({ autoIndex: true, timestamps: true })
export class User {
  @Prop({ required: true, index: true, unique: true, immutable: true })
  idpId: string;
  @Prop({ required: true, unique: true })
  username: string;
  @Prop({ required: true, index: true, sparse: true })
  email: string;
  @Prop()
  picture: string;
  @Prop()
  lastname: string;
  @Prop()
  firstname: string;
  @Prop({ required: true, index: true, sparse: true })
  mobilePhone: string;
  @Prop()
  birthdate: Date;
  @Prop({ required: true })
  country: string;
  @Prop({ default: Date.now })
  createdAt?: Date;
  @Prop({ default: Date.now })
  updateAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ idpId: 1 }, { unique: true });
