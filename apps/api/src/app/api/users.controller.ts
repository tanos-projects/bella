import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../infrastructure/users/users.service';
import { CreateUserDTO, UserDTO } from '@bella/dtos';
import { UserMapper } from '@bella/api/adapters';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('check')
  check(@Request() req): Observable<{ hasProfile: boolean }> {
    const user: AuthUser = req.user;
    return this.usersService
      .findOneByIdpId(user.sub)
      .pipe(map((userData) => ({ hasProfile: Boolean(userData) })));
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  getProfile(@Request() req): Observable<UserDTO> {
    const user: AuthUser = req.user;
    return this.usersService.findOneByIdpId(user.sub).pipe(map(UserMapper.modelToDTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiBearerAuth()
  createProfile(
    @Request() req,
    @Body() payload: CreateUserDTO
  ): Observable<UserDTO> {
    const user: AuthUser = req.user;
    return this.usersService
      .create({ ...payload, idpId: user.sub, picture: user.picture } as any)
      .pipe(map(UserMapper.modelToDTO));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  updateProfile(
    @Request() req,
    @Body() payload: CreateUserDTO
  ): Observable<UserDTO> {
    const user: AuthUser = req.user;
    return this.usersService
      .updateOneByIdpId(user.sub, {
        ...UserMapper.dtoToModel(payload),
        picture: user.picture,
      })
      .pipe(map(UserMapper.modelToDTO));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  @ApiBearerAuth()
  deleteProfile(@Request() req): Observable<void> {
    const user: AuthUser = req.user;
    return this.usersService.deleteOneByIdpId(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<UserDTO> {
    return this.usersService.findOne(id).pipe(map(UserMapper.modelToProfileDTO));
  }

  // TODO : Move all below to admin controller
  // @Get()
  // getAll(): Observable<UserDTO[]> {
  //   return this.usersService.findAll().pipe(map(modelToDTOList));
  // }

  // @Get('search/:username')
  // findByUsername(@Param('username') username: string): Observable<UserDTO> {
  //   return this.usersService.findByUsername(username).pipe(map(modelToDTO));
  // }
}
