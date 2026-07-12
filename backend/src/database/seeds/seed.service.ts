import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Department } from '../entities/department.entity';
import { Issue, IssueCategory, IssueStatus, IssuePriority } from '../entities/issue.entity';
import { Volunteer, HeroLevel } from '../entities/volunteer.entity';

const departments = [
  { name: 'Roads & Infrastructure', code: 'ROADS', description: 'Road maintenance, potholes, bridges, flyovers' },
  { name: 'Water Supply & Sewerage', code: 'WATER', description: 'Water supply, pipe leaks, sewerage systems' },
  { name: 'Sanitation & Cleanliness', code: 'SANITATION', description: 'Garbage collection, public toilets, sweeping' },
  { name: 'Electricity & Power', code: 'ELECTRICITY', description: 'Street lights, power lines, transformers' },
  { name: 'Solid Waste Management', code: 'WASTE', description: 'Waste collection, recycling, landfills' },
  { name: 'Drainage & Flood Control', code: 'DRAINAGE', description: 'Drainage systems, flood prevention, storm water' },
  { name: 'Public Safety', code: 'SAFETY', description: 'Traffic signals, pedestrian safety, accident spots' },
  { name: 'Parks & Gardens', code: 'PARKS', description: 'Public parks, gardens, green spaces' },
  { name: 'Building Safety', code: 'BUILDING', description: 'Building structural safety, illegal construction' },
  { name: 'Pollution Control', code: 'POLLUTION', description: 'Air quality, noise pollution, industrial waste' },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'communityiq',
    entities: [User, Department, Issue, Volunteer],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected for seeding...');

  const userRepo = dataSource.getRepository(User);
  const deptRepo = dataSource.getRepository(Department);
  const issueRepo = dataSource.getRepository(Issue);
  const volRepo = dataSource.getRepository(Volunteer);

  // Seed departments
  const savedDepts: Department[] = [];
  for (const dept of departments) {
    let existing = await deptRepo.findOne({ where: { code: dept.code } });
    if (!existing) {
      existing = deptRepo.create(dept);
      existing = await deptRepo.save(existing);
      console.log(`Created department: ${dept.name}`);
    }
    savedDepts.push(existing);
  }

  // Seed admin user
  let admin = await userRepo.findOne({ where: { email: 'admin@communityiq.com' } });
  if (!admin) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    admin = userRepo.create({
      email: 'admin@communityiq.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      isActive: true,
      emailVerified: true,
    });
    admin = await userRepo.save(admin);
    console.log('Created admin user: admin@communityiq.com / Admin@123');
  }

  // Seed department admin
  let deptAdmin = await userRepo.findOne({ where: { email: 'dept.admin@communityiq.com' } });
  if (!deptAdmin) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('DeptAdmin@123', salt);
    deptAdmin = userRepo.create({
      email: 'dept.admin@communityiq.com',
      password: hashedPassword,
      firstName: 'Department',
      lastName: 'Admin',
      role: UserRole.DEPARTMENT_ADMIN,
      isVerified: true,
      isActive: true,
      emailVerified: true,
    });
    deptAdmin = await userRepo.save(deptAdmin);
    console.log('Created department admin: dept.admin@communityiq.com / DeptAdmin@123');
  }

  // Seed citizen users
  const citizens = [
    { email: 'citizen1@communityiq.com', firstName: 'Rahul', lastName: 'Sharma', password: 'Citizen@123' },
    { email: 'citizen2@communityiq.com', firstName: 'Priya', lastName: 'Patel', password: 'Citizen@123' },
    { email: 'citizen3@communityiq.com', firstName: 'Amit', lastName: 'Kumar', password: 'Citizen@123' },
  ];

  const savedCitizens: User[] = [];
  for (const c of citizens) {
    let existing = await userRepo.findOne({ where: { email: c.email } });
    if (!existing) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(c.password, salt);
      existing = userRepo.create({
        email: c.email,
        password: hashedPassword,
        firstName: c.firstName,
        lastName: c.lastName,
        role: UserRole.CITIZEN,
        isVerified: true,
        isActive: true,
        emailVerified: true,
      });
      existing = await userRepo.save(existing);
      console.log(`Created citizen: ${c.email}`);
    }
    savedCitizens.push(existing);
  }

  // Seed volunteer user
  let volunteerUser = await userRepo.findOne({ where: { email: 'volunteer@communityiq.com' } });
  if (!volunteerUser) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Volunteer@123', salt);
    volunteerUser = userRepo.create({
      email: 'volunteer@communityiq.com',
      password: hashedPassword,
      firstName: 'Community',
      lastName: 'Hero',
      role: UserRole.VOLUNTEER,
      isVerified: true,
      isActive: true,
      emailVerified: true,
    });
    volunteerUser = await userRepo.save(volunteerUser);

    const volunteer = volRepo.create({
      userId: volunteerUser.id,
      points: 150,
      heroLevel: HeroLevel.ACTIVE_CITIZEN,
      totalContributions: 25,
      verifiedContributions: 18,
      issuesReported: 10,
      issuesVerified: 15,
      commentsAdded: 8,
      accuracyScore: 85.5,
      isActive: true,
      badges: [
        { id: 'first_report', name: 'First Responder', icon: 'report', description: 'Reported first issue', earnedAt: new Date() },
        { id: 'verifier', name: 'Truth Seeker', icon: 'verify', description: 'Verified 10 issues', earnedAt: new Date() },
      ],
    });
    await volRepo.save(volunteer);
    console.log('Created volunteer user: volunteer@communityiq.com / Volunteer@123');
  }

  // Seed sample issues
  const issueCount = await issueRepo.count();
  if (issueCount === 0) {
    const sampleIssues = [
      {
        title: 'Large pothole on MG Road near junction',
        description: 'A dangerous pothole approximately 2 feet wide has formed on MG Road near the main junction. It is causing traffic jams and has already damaged two vehicles. Immediate repair needed.',
        category: IssueCategory.ROAD_DAMAGE,
        status: IssueStatus.REPORTED,
        priority: IssuePriority.HIGH,
        address: 'MG Road, Near City Junction',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        ward: 'Ward 5',
        reporterId: savedCitizens[0]?.id,
        departmentId: savedDepts[0]?.id,
        upvotes: 15,
        downvotes: 2,
        communityScore: 75,
        impactScore: 65,
        riskScore: 70,
        viewCount: 234,
        commentCount: 8,
      },
      {
        title: 'Water leakage from main pipe in residential area',
        description: 'Continuous water leakage from a broken underground pipe for the last 3 days. Water is stagnating on the road and causing mosquito breeding. Multiple households affected.',
        category: IssueCategory.WATER_SUPPLY,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        address: '15 Park Street, Block C',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        ward: 'Ward 12',
        reporterId: savedCitizens[1]?.id,
        departmentId: savedDepts[1]?.id,
        assignedToId: deptAdmin?.id,
        upvotes: 32,
        downvotes: 0,
        communityScore: 90,
        impactScore: 85,
        riskScore: 80,
        viewCount: 567,
        commentCount: 15,
      },
      {
        title: 'Garbage dumped near school playground',
        description: 'Illegal dumping of construction and household waste near the government school playground. Children cannot use the playground. Strong odor affecting the school environment.',
        category: IssueCategory.GARBAGE,
        status: IssueStatus.REPORTED,
        priority: IssuePriority.HIGH,
        address: 'Government Primary School, Lane 7',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700025',
        ward: 'Ward 8',
        reporterId: savedCitizens[2]?.id,
        departmentId: savedDepts[4]?.id,
        upvotes: 28,
        downvotes: 1,
        communityScore: 82,
        impactScore: 75,
        riskScore: 60,
        viewCount: 345,
        commentCount: 12,
      },
      {
        title: 'Street lights not working on Highway 34',
        description: 'Entire stretch of Highway 34 from km marker 15 to km marker 22 has no working street lights for the past 2 weeks. Multiple accidents reported at night.',
        category: IssueCategory.STREET_LIGHTING,
        status: IssueStatus.REPORTED,
        priority: IssuePriority.CRITICAL,
        address: 'Highway 34, KM 15-22',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700032',
        ward: 'Ward 20',
        reporterId: savedCitizens[0]?.id,
        departmentId: savedDepts[3]?.id,
        upvotes: 45,
        downvotes: 0,
        communityScore: 95,
        impactScore: 90,
        riskScore: 85,
        viewCount: 890,
        commentCount: 22,
        isUrgent: true,
      },
      {
        title: 'Open manhole cover on busy intersection',
        description: 'Missing manhole cover at the intersection of Lake Road and Station Street. Extremely dangerous for pedestrians and vehicles. Someone could fall in and get seriously injured.',
        category: IssueCategory.SANITATION,
        status: IssueStatus.RESOLVED,
        priority: IssuePriority.EMERGENCY,
        address: 'Lake Road & Station Street Intersection',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700013',
        ward: 'Ward 3',
        reporterId: savedCitizens[1]?.id,
        departmentId: savedDepts[2]?.id,
        upvotes: 67,
        downvotes: 0,
        communityScore: 100,
        impactScore: 95,
        riskScore: 95,
        resolvedAt: new Date(Date.now() - 2 * 86400000),
        viewCount: 1234,
        commentCount: 30,
      },
    ];

    for (const issueData of sampleIssues) {
      const issue = issueRepo.create(issueData as any);
      await issueRepo.save(issue);
    }
    console.log(`Created ${sampleIssues.length} sample issues`);
  }

  console.log('\nSeeding completed successfully!');
  console.log('\nTest credentials:');
  console.log('  Admin:      admin@communityiq.com / Admin@123');
  console.log('  Dept Admin: dept.admin@communityiq.com / DeptAdmin@123');
  console.log('  Citizens:   citizen1@communityiq.com / Citizen@123');
  console.log('  Volunteer:  volunteer@communityiq.com / Volunteer@123');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
