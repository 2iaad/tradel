import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Skip access-token authentication for this route. Other guards still run.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
