import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CityDocument = HydratedDocument<City>;

@Schema({ autoIndex: true })
export class City {
  @Prop({ required: true, unique: true, immutable: true })
  id: string;
  @Prop({ index: true })
  countryiso2: string;
  @Prop({})
  stateCode: string;
  @Prop({})
  state: string;
  @Prop({})
  provinceCode: string;
  @Prop({})
  province: string;
  @Prop({})
  departmentCode: string;
  @Prop({})
  department: string;
  @Prop({})
  code: string;
  @Prop({ index: true })
  label: string;
}

export const CitySchema = SchemaFactory.createForClass(City);
