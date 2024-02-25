import {
  Controller,
  Header,
  Post,
  Param,
  Query,
  Get,
  Put,
  Body,
  Res,
  Req,
  HttpStatus,
  BadRequestException,
  HttpException,
  Next,
  UseGuards,
  Redirect,
  NotFoundException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { BcryptService } from '../utils/bcrypt/bcrypt.service';
import { JwtAuthGuard, KakaoAuthGuard, NaverAuthGuard, GoogleAuthGuard } from './oauth/auth.guard';

@ApiTags('login')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly bcryptService: BcryptService
  ) {}

  /**
   * oauth 사용자 인증 가입처리
   * @param res
   * @param req
   * @param user
   */
  private async checkUser(res: Response, req: Request, user: any) {
    try {
      // 회원가입 체크
      const checkUser = await this.authService.findUser(user);

      // 회원가입이 되어있으면 토큰 발급
      if (checkUser) {
        const accessToken = await this.authService.login(checkUser);

        res.cookie('authCookie', accessToken, {
          maxAge: 900000,
          httpOnly: true,
        });

        return res.status(HttpStatus.OK).json({ accessToken });
      }
      return res.status(201).json({message : 'needsignup'})
      //return res.redirect(`/signup?test=${accessToken}`);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 구글 로그인
   * @param res
   * @param req
   */
  @ApiOperation({
    summary: '구글 로그인',
    description: '구글 사용자 인증',
  })
  @UseGuards(GoogleAuthGuard)
  @Get('/oauth/callback/google')
  async googlaCallback(@Res() res: Response, @Req() req: Request) {
    return this.checkUser(res, req, req.user);
  }

  /**
   * 카카오 로그인
   * @param res
   * @param req
   */
  @ApiOperation({
    summary: '카카오 로그인',
    description: '카카오 사용자 인증',
  })
  @UseGuards(KakaoAuthGuard)
  @Get('/oauth/callback/kakao')
  async kakaoCallback(@Res() res: Response, @Req() req: Request) {
    return this.checkUser(res, req, req.user);
  }

  /**
   * 네이버 로그인
   * @param res
   * @param req
   */
  @ApiOperation({
    summary: '네이버 로그인',
    description: '네이버 사용자 인증',
  })
  @UseGuards(NaverAuthGuard)
  @Get('/oauth/callback/naver')
  async naverCallback(@Res() res: Response, @Req() req: Request) {
    return this.checkUser(res, req, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/signup')
  signUp(@Res() res: Response, @Req() req: Request) {
    res.status(200).json({ message: '회원가입 form' });
  }
}