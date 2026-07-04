import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
@UseGuards(JwtGuard)
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) {}

    @Post()
    create(@Body() createAccountDto: CreateAccountDto, @Req() req: Request) {
        return this.accountsService.create(req.user.sub, createAccountDto);
    }

    @Get()
    findAll(@Req() req: Request) {
        return this.accountsService.findAll(req.user.sub);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.accountsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
        return this.accountsService.update(+id, updateAccountDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.accountsService.remove(+id);
    }
}
