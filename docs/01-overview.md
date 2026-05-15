# overview

## first steps

we can create a new Nest project with the following commands:
```
$ npm i -g @nestjs/cli
$ nest new tradel
```

> By default @nestjs/platform-express package is used, so its on top of express by default (the other option is fastify).
> By default, NestJS runs on top of Express. When you use decorators like @Get(), @Post(), @Body(), etc., Nest is translating those into Express route handlers under the hood. You just never see it.

### inside the tradel/src

| File                      | Description                                                                                   |
|---------------------------|-----------------------------------------------------------------------------------------------|
| `app.controller.ts`       | A basic controller with a single route.                                                       |
| `app.controller.spec.ts`  | The unit tests for the controller.                                                            |
| `app.module.ts`           | The root module of the application.                                                           |
| `app.service.ts`          | A basic service with a single method.                                                         |
| `main.ts`                 | The entry file of the application which uses the core function `NestFactory` to create a Nest application instance. |

### running the application

`$ npm run start`

- **for watch mode** : `$ npm run start:dev`

> nestjs comes with .prettier configuration ready if u setup the project using nest CLI.

## controllers

Controllers are responsible for handling incoming requests and sending responses back to the client.