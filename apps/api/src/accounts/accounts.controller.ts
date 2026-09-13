import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('accounts')
@ApiCookieAuth('access_token')
@Controller('accounts')
@UseGuards(JwtGuard)
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a trading account' })
    create(@Body() createAccountDto: CreateAccountDto, @Req() req: Request) {
        return this.accountsService.create(req.user.sub, createAccountDto);
    }

    @Get()
    @ApiOperation({ summary: 'List the current user’s accounts' })
    findAll(@Req() req: Request) {
        return this.accountsService.findAll(req.user.sub);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get one account' })
    findOne(@Param('id') id: string, @Req() req: Request) {
        return this.accountsService.findOne(id, req.user.sub);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an account' })
    update(
        @Param('id') id: string,
        @Body() updateAccountDto: UpdateAccountDto,
        @Req() req: Request,
    ) {
        return this.accountsService.update(id, req.user.sub, updateAccountDto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete an account' })
    remove(@Param('id') id: string, @Req() req: Request) {
        return this.accountsService.remove(id, req.user.sub);
    }
}
