import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DataSource } from 'typeorm';
import { User, UserRole } from './database/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Assign GPS coordinates to issues that have no PostGIS location yet
// (deterministic per-id jitter around the city centre so markers show on the map)
async function backfillIssueLocations(dataSource: DataSource) {
  try {
    const { Issue } = require('./database/entities/issue.entity');
    const issueRepo = dataSource.getRepository(Issue);
    const missing = await issueRepo
      .createQueryBuilder('issue')
      .where('issue.location IS NULL')
      .getMany();

    if (missing.length === 0) {
      console.log('Location backfill: no issues missing coordinates.');
      return;
    }
    console.log(`Location backfill: assigning coordinates to ${missing.length} issues...`);

    const cities: Record<string, [number, number]> = {
      KOLKATA: [22.5726, 88.3639],
      MUMBAI: [19.076, 72.8777],
      DELHI: [28.6139, 77.209],
      BENGALURU: [12.9716, 77.5946],
      CHENNAI: [13.0827, 80.2707],
      HYDERABAD: [17.385, 78.4867],
      PUNE: [18.5204, 73.8567],
    };

    for (const issue of missing) {
      const cityKey = (issue.city || 'Kolkata').toUpperCase();
      const [baseLat, baseLng] = cities[cityKey] || cities.KOLKATA;
      const seed = issue.id
        ? Array.from(String(issue.id)).reduce((acc, c) => acc + c.charCodeAt(0), 0)
        : Math.floor(Math.random() * 100000);
      const lat = baseLat + ((seed % 100) - 50) / 1000;
      const lng = baseLng + (((seed * 7) % 100) - 50) / 1000;
      await issueRepo.query(
        `UPDATE issues SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [lng, lat, issue.id],
      );
    }
    console.log(`Location backfill: done (${missing.length} issues updated).`);
  } catch (e: any) {
    console.warn(`Location backfill skipped: ${e.message}`);
  }
}

async function seedUsers(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  // Explicitly verify DB connection
  if (!dataSource.isInitialized) {
    console.log('Waiting for database connection...');
    await dataSource.initialize();
  }
  console.log('Database connected. Checking for existing users...');

  const count = await userRepo.count();
  console.log(`Found ${count} existing users.`);

  if (count > 0) {
    console.log('Users already exist — skipping seed.');
    // Verify existing users have valid hashes
    const sampleUser = await userRepo.findOne({ where: { email: 'superadmin@test.com' }, select: ['id', 'email', 'password'] });
    if (sampleUser && sampleUser.password) {
      const hashValid = await bcrypt.compare('Test@1234', sampleUser.password);
      console.log(`Password hash verification for superadmin@test.com: ${hashValid ? 'VALID' : 'INVALID — re-seeding needed'}`);
      if (!hashValid) {
        console.log('Clearing and re-seeding all users...');
        await userRepo.clear();
      } else {
        return;
      }
    } else {
      console.log('Could not verify existing users — re-seeding...');
      await userRepo.clear();
    }
  }

  console.log('Seeding test accounts...');

  const testPassword = 'Test@1234';
  const hashedPassword = await bcrypt.hash(testPassword, 12);

  // Verify the hash is valid before saving
  const hashVerification = await bcrypt.compare(testPassword, hashedPassword);
  console.log(`Generated hash verification: ${hashVerification ? 'VALID' : 'CRITICAL FAILURE'}`);
  if (!hashVerification) {
    throw new Error('bcrypt hash verification failed — cannot seed users');
  }

  const testUsers = [
    { email: 'superadmin@test.com', firstName: 'Super', lastName: 'Admin', role: UserRole.SUPER_ADMIN, phone: '+15551000001' },
    { email: 'municipal@test.com', firstName: 'Municipal', lastName: 'Admin', role: UserRole.MUNICIPAL_ADMIN, phone: '+15551000002' },
    { email: 'deptadmin@test.com', firstName: 'Dept', lastName: 'Admin', role: UserRole.DEPARTMENT_ADMIN, phone: '+15551000003' },
    { email: 'volunteer@test.com', firstName: 'Test', lastName: 'Volunteer', role: UserRole.VOLUNTEER, phone: '+15551000004' },
    { email: 'citizen@test.com', firstName: 'Test', lastName: 'Citizen', role: UserRole.CITIZEN, phone: '+15551000005' },
  ];

  for (const u of testUsers) {
    const user = userRepo.create({
      ...u,
      password: hashedPassword,
      isVerified: true,
      isActive: true,
    });
    const saved = await userRepo.save(user);
    console.log(`  Seeded ${u.role}: ${u.email} (id=${saved.id})`);

    // Immediately verify the saved user can be found and password matches
    const verifyUser = await userRepo.findOne({ where: { email: u.email }, select: ['email', 'password'] });
    if (verifyUser) {
      const pwValid = await bcrypt.compare(testPassword, verifyUser.password);
      console.log(`    Login verification for ${u.email}: ${pwValid ? 'PASS' : 'FAIL'}`);
    }
  }

  console.log('');
  console.log('========================================');
  console.log('SEED COMPLETE — All accounts ready:');
  console.log('Password for all accounts: Test@1234');
  console.log('========================================');
  console.log('');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const globalPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('CommunityIQ API')
    .setDescription('AI-Powered Community Issue Management System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Users', 'User management')
    .addTag('Issues', 'Civic issue management')
    .addTag('AI Intelligence', 'AI-powered analysis and predictions')
    .addTag('Community', 'Community verification and engagement')
    .addTag('GIS', 'Geographic and spatial analysis')
    .addTag('Notifications', 'Push and in-app notifications')
    .addTag('Emergency', 'Emergency alerts and response')
    .addTag('Analytics', 'Dashboards and reporting')
    .addTag('Volunteers', 'Community heroes and volunteer management')
    .addTag('Upload', 'File upload and management')
    .addTag('Health', 'System health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const dataSource = app.get(DataSource);
  await seedUsers(dataSource);
  await backfillIssueLocations(dataSource);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
