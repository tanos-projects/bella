import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModeratorIdentityDocument = HydratedDocument<ModeratorIdentity>;

// Separate collection from `users` (the marketplace User schema) on
// purpose - see ModeratorIdentityEntity for why.
@Schema({ autoIndex: true, timestamps: false })
export class ModeratorIdentity {
  @Prop({ required: true, unique: true, index: true })
  idpId: string;
  @Prop()
  email?: string;
  @Prop()
  name?: string;
  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const ModeratorIdentitySchema = SchemaFactory.createForClass(ModeratorIdentity);
