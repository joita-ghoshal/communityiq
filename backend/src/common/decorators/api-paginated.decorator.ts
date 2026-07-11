import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiPaginationQuery, getSchemaPath } from '@nestjs/swagger';

export function ApiPaginatedResponse(model: any) {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    }),
  );
}
