import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './posts.service';
import { posts, users } from '@prisma/client';
import { CreatePostsDto } from './dto/create-post.dto';
import { UpdatePostsDto } from './dto/update-post.dto';
import { PagingPostsDto } from './dto/paging-post.dto';
import { response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import { S3Service } from 'src/providers/aws/s3/s3.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * 목록
   * + 페이징 처리
   * '/posts?orderBy=createdAt&lastPostId=10', '/posts?orderBy=preference&lastPostId=10'
   * @returns
   */
  @Get()
  @UseFilters(HttpExceptionFilter)
  @HttpCode(200)
  async getAllPosts(@Query() pagingPostsDto: PagingPostsDto) {
    try {
      let orderField: 'createdAt' | 'preference' = 'createdAt'; //기본값 최신순
      if (pagingPostsDto.orderBy === 'preference') {
        orderField = 'preference';
      }
      const lastPostId = Number(pagingPostsDto.lastPostId);
      const posts = await this.postService.getAllPosts(orderField, lastPostId);
      return posts;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 게시글 상세조회
   * @param postId
   * @returns
   */
  @Get(':postId')
  @UseFilters(HttpExceptionFilter)
  @HttpCode(200)
  async getOnePost(@Param('postId') postId: number) {
    // const post = await this.postService.getOnePost(postId);
    // return post;
    try {
      const post = await this.postService.getOnePost(postId);
      return post;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 게시글 참가 유저 프로필 조회
   * @param userId
   * @returns
   */
  @Get(':userId')
  @UseFilters(HttpExceptionFilter)
  @HttpCode(200)
  async getProfileInPost(@Param('userId') userId: number) {
    // const user = await this.postService.getProfileInPost(userId);
    // return user;

    try {
      const user = await this.postService.getProfileInPost(userId);
      console.log('user', user);

      // if(user. === 'private'){
      //   return { message: '비공개계정입니다' };
      // }
      return user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 게시글 작성
   * post_userId는 나중에 로그인한 userId 넣어주기
   * @param createPostsDto
   * @returns
   */
  @Post()
  @UseFilters(HttpExceptionFilter)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('imageName'))
  @HttpCode(200)
  async createPost(
    @Body('postTitle') postTitle: string,
    @Body('content') content: string,
    @Body('postType') postType: string,
    @Body('position') position: string,
    @Body('fileName') fileName: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      await this.postService.createPost(postTitle, content, postType, position, fileName, file);
      return { message: '게시글이 작성되었습니다' };
    } catch (error) {
      // console.error('error', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 게시글 수정
   * @param postId
   * @param updatePostsDto
   * @returns
   */
  @Put(':postId')
  @UseFilters(HttpExceptionFilter)
  @HttpCode(200)
  async updatePost(@Param('postId') postId: number, @Body() updatePostsDto: UpdatePostsDto) {
    try {
      await this.postService.updatePost(postId, updatePostsDto);
      return { message: '수정되었습니다' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 게시글 삭제
   * + 본인인증
   * + 해당 게시글 존재 확인
   * @param postId
   * @param updatePostsDto
   * @returns
   */
  @Delete(':postId')
  @UseFilters(HttpExceptionFilter)
  @HttpCode(200)
  async deletePost(@Param('postId') postId: number) {
    try {
      await this.postService.deletePost(postId);
      return { message: '삭제되었습니다' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    // await this.postService.deletePost(postId);
    // return { message: '삭제되었습니다' };
  }

  // //검색
  // @Get()
  // async searchPosts(@Query('search') search: string) {
  //   return await this.postService.searchPosts(search);
  // }
}
