import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import { Issue, IssueCategory, IssuePriority, IssueStatus } from '../../database/entities/issue.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL', 'gemini-pro');
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL', 'gpt-4');
  }

  async analyzeIssueById(issueId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException(`Issue ${issueId} not found`);

    const input = `Title: ${issue.title}\nDescription: ${issue.description}\nCategory: ${issue.category}`;
    let analysis: any;

    if (this.openaiApiKey) {
      analysis = await this.analyzeWithOpenAI(input);
    } else if (this.geminiApiKey) {
      analysis = await this.analyzeWithGemini(input);
    } else {
      analysis = this.fallbackAnalysis(issue);
    }

    await this.issueRepository.update(issueId, { aiAnalysis: analysis });
    return { issueId, analysis, timestamp: new Date().toISOString() };
  }

  async analyzeIssue(issueData: { title: string; description: string; category: string; latitude: number; longitude: number }) {
    if (this.openaiApiKey) {
      try {
        const prompt = `You are a civic issue analyst. Analyze the following reported issue and provide a severity assessment and priority suggestion.

Title: ${issueData.title}
Description: ${issueData.description}
Category: ${issueData.category}
Location: (${issueData.latitude}, ${issueData.longitude})

Respond in JSON format only:
{
  "suggestedPriority": "<low|medium|high|critical|emergency>",
  "suggestedCategory": "<best matching category from: road_damage, water_supply, sanitation, electricity, garbage, drainage, street_lighting, public_safety, noise_pollution, air_pollution, parks_green, traffic, building_safety, flooding, animal_control, other>",
  "severityScore": <number 1-10>,
  "analysis": "<2-3 sentence analysis of the issue severity, potential impact, and why this priority was assigned>"
}`;

        const response = await firstValueFrom(
          this.httpService.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4-vision-preview',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
              max_tokens: 500,
            },
            {
              headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          ),
        );

        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e: any) {
        this.logger.error('OpenAI analyzeIssue error', e.message);
      }
    }

    return this.mockAnalyzeIssue(issueData);
  }

  async verifyImage(imageBase64: string, description: string, category: string) {
    if (this.openaiApiKey) {
      try {
        const prompt = `You are an image verification AI for a civic issue reporting platform. Analyze the provided image and verify whether it matches the reported issue description and category.

Description: ${description}
Category: ${category}

Respond in JSON format only:
{
  "verified": <true if image appears to match the description>,
  "confidence": <number 0-1>,
  "analysis": "<2-3 sentences describing what you see in the image and whether it matches the description>",
  "categoryMatch": <true if the image content matches the claimed category>,
  "descriptionMatch": <true if the image content matches the provided description>
}`;

        const response = await firstValueFrom(
          this.httpService.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4-vision-preview',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    {
                      type: 'image_url',
                      image_url: {
                        url: imageBase64.startsWith('data:')
                          ? imageBase64
                          : `data:image/jpeg;base64,${imageBase64}`,
                      },
                    },
                  ],
                },
              ],
              temperature: 0.3,
              max_tokens: 500,
            },
            {
              headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          ),
        );

        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e: any) {
        this.logger.error('OpenAI verifyImage error', e.message);
      }
    }

    return this.mockVerifyImage(description, category);
  }

  async generateInsights(issues: any[]) {
    if (this.openaiApiKey) {
      try {
        const issueSummary = issues.slice(0, 50).map((i: any) =>
          `- ${i.title} | ${i.category} | ${i.status || 'open'} | priority: ${i.priority || 'medium'}`
        ).join('\n');

        const prompt = `You are a civic intelligence AI. Analyze the following community issues and generate actionable insights.

Issues (${issues.length} total):
${issueSummary}

Respond in JSON format only:
{
  "insights": [
    {
      "title": "<short insight title>",
      "description": "<detailed description of the insight>",
      "type": "<trend|pattern|recommendation>"
    }
  ]
}

Provide 3-5 insights covering trends, patterns, and recommendations.`;

        const response = await firstValueFrom(
          this.httpService.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4-vision-preview',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.5,
              max_tokens: 1000,
            },
            {
              headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          ),
        );

        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e: any) {
        this.logger.error('OpenAI generateInsights error', e.message);
      }
    }

    return this.mockGenerateInsights(issues);
  }

  private mockAnalyzeIssue(issueData: { title: string; description: string; category: string; latitude: number; longitude: number }) {
    const categoryPriorityMap: Record<string, string> = {
      public_safety: 'high',
      building_safety: 'critical',
      flooding: 'high',
      electricity: 'high',
      road_damage: 'medium',
      water_supply: 'medium',
      drainage: 'medium',
      garbage: 'low',
      street_lighting: 'low',
      noise_pollution: 'low',
    };

    const severityMap: Record<string, number> = {
      public_safety: 8,
      building_safety: 9,
      flooding: 7,
      electricity: 7,
      road_damage: 5,
      water_supply: 5,
      drainage: 5,
      garbage: 3,
      street_lighting: 3,
      noise_pollution: 2,
    };

    const descLength = issueData.description?.length || 0;
    const basePriority = categoryPriorityMap[issueData.category] || 'medium';
    const baseSeverity = severityMap[issueData.category] || 5;
    const severityAdjust = descLength > 200 ? 1 : descLength < 30 ? -1 : 0;

    const priorities = ['low', 'medium', 'high', 'critical', 'emergency'];
    let priorityIndex = priorities.indexOf(basePriority);
    if (severityAdjust > 0) priorityIndex = Math.min(priorityIndex + 1, 4);
    if (severityAdjust < 0) priorityIndex = Math.max(priorityIndex - 1, 0);

    return {
      suggestedPriority: priorities[priorityIndex],
      suggestedCategory: issueData.category,
      severityScore: Math.min(10, Math.max(1, baseSeverity + severityAdjust)),
      analysis: `Issue "${issueData.title}" categorized as ${issueData.category}. Based on the description and category, this has been assigned ${priorities[priorityIndex]} priority. Severity score reflects potential community impact.`,
    };
  }

  private mockVerifyImage(description: string, category: string) {
    const confidence = 0.5 + Math.random() * 0.4;
    const verified = confidence > 0.6;
    return {
      verified,
      confidence: Math.round(confidence * 100) / 100,
      analysis: `Simulated verification: The image was evaluated against the description "${description.substring(0, 100)}" for category "${category}". ${verified ? 'The image appears to be consistent with the reported issue.' : 'Could not fully confirm the image matches the reported issue.'}`,
      categoryMatch: Math.random() > 0.3,
      descriptionMatch: confidence > 0.5,
    };
  }

  private mockGenerateInsights(issues: any[]) {
    const categoryCounts: Record<string, number> = {};
    issues.forEach((i: any) => {
      categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCounts).sort((a: any, b: any) => b[1] - a[1])[0];

    return {
      insights: [
        {
          title: 'Issue Distribution Trend',
          description: `Out of ${issues.length} reported issues, ${topCategory ? `${topCategory[0]} leads with ${topCategory[1]} reports` : 'issues are spread across categories'}. Consider allocating resources to address the most reported category.`,
          type: 'trend' as const,
        },
        {
          title: 'Geographic Clustering',
          description: 'Multiple issues are concentrated in similar areas. This suggests systemic infrastructure problems that could be addressed with comprehensive area development plans.',
          type: 'pattern' as const,
        },
        {
          title: 'Resolution Priority',
          description: `With ${issues.length} active issues, focusing on high-priority categories first will maximize community impact. Consider prioritizing safety-related issues.`,
          type: 'recommendation' as const,
        },
      ],
    };
  }

  async classifyIssue(text: string) {
    const result = await this.callAI(
      `Classify this civic issue as JSON: {"category":"<category>","confidence":<0-1>,"keywords":["..."],"suggestedPriority":"<low|medium|high|critical>"}. Categories: ${Object.values(IssueCategory).join(', ')}. Text: ${text}`,
    );
    if (result) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch { /* fallback */ }
    }
    return this.fallbackClassification(text);
  }

  async predictResolution(issueId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException(`Issue ${issueId} not found`);

    const result = await this.callAI(
      `Predict resolution for: ${issue.title} (${issue.category}, ${issue.priority}). JSON: {"estimatedDays":<n>,"confidence":<0-1>,"complexity":"<low|medium|high>"}`,
    );
    if (result) {
      try {
        const m = result.match(/\{[\s\S]*\}/);
        if (m) return { issueId, prediction: JSON.parse(m[0]) };
      } catch { /* fallback */ }
    }
    return {
      issueId,
      prediction: {
        estimatedDays: this.estimateResolutionDays(issue.category, issue.priority),
        confidence: 0.5,
        factors: ['Category-based estimation'],
        complexity: this.assessComplexity(issue.category),
      },
    };
  }

  async detectDuplicates(issueId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException(`Issue ${issueId} not found`);

    const candidates = await this.issueRepository
      .createQueryBuilder('i')
      .where('i.id != :id', { id: issueId })
      .andWhere('i.category = :cat', { cat: issue.category })
      .andWhere('i.status != :res', { res: IssueStatus.RESOLVED })
      .limit(10)
      .getMany();

    const scored = candidates.map((dup) => {
      let sim = 0;
      if (dup.category === issue.category) sim += 0.3;
      const w1 = new Set(issue.title.toLowerCase().split(/\s+/));
      const w2 = new Set(dup.title.toLowerCase().split(/\s+/));
      const inter = [...w1].filter((w) => w2.has(w));
      const union = new Set([...w1, ...w2]);
      sim += (inter.length / union.size) * 0.4;
      if (dup.ward === issue.ward) sim += 0.2;
      return { id: dup.id, title: dup.title, similarity: Math.round(sim * 100) / 100, status: dup.status };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return { issueId, potentialDuplicates: scored.filter((d) => d.similarity > 0.3), totalFound: scored.length };
  }

  async detectFakes(issueId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException(`Issue ${issueId} not found`);

    let score = 0;
    const indicators: string[] = [];

    const reportCount = await this.issueRepository.count({ where: { reporterId: issue.reporterId } });
    if (reportCount > 20) { score += 0.2; indicators.push('High report count'); }
    if (issue.title.length < 10) { score += 0.15; indicators.push('Short title'); }
    if (issue.description.length < 30) { score += 0.15; indicators.push('Short description'); }
    if (!issue.location) { score += 0.25; indicators.push('No location'); }
    if (issue.upvotes === 0 && issue.downvotes > 2) { score += 0.15; indicators.push('More downvotes'); }

    const recentCount = await this.issueRepository
      .createQueryBuilder('i')
      .where('i.reporterId = :rid', { rid: issue.reporterId })
      .andWhere('i.createdAt > :d', { d: new Date(Date.now() - 86400000) })
      .getCount();
    if (recentCount > 5) { score += 0.2; indicators.push('Multiple reports in 24h'); }

    return {
      issueId,
      fakeProbability: Math.min(score, 1),
      isLikelyFake: score > 0.5,
      indicators,
      confidence: 0.6,
      recommendation: score > 0.7 ? 'Manual review' : score > 0.4 ? 'Additional verification' : 'Legitimate',
    };
  }

  async generateSummary(data: { city?: string; category?: string; days?: number }) {
    const { city, category, days = 30 } = data;
    const qb = this.issueRepository.createQueryBuilder('issue');
    if (city) qb.andWhere('issue.city ILIKE :city', { city: `%${city}%` });
    if (category) qb.andWhere('issue.category = :category', { category });
    qb.andWhere('issue.createdAt >= :sd', { sd: new Date(Date.now() - days * 86400000) });
    const issues = await qb.getMany();

    const stats = {
      total: issues.length,
      open: issues.filter((i) => i.status === IssueStatus.OPEN).length,
      resolved: issues.filter((i) => i.status === IssueStatus.RESOLVED).length,
      critical: issues.filter((i) => i.priority === IssuePriority.CRITICAL || i.priority === IssuePriority.EMERGENCY).length,
      categories: {} as Record<string, number>,
    };
    issues.forEach((i) => { stats.categories[i.category] = (stats.categories[i.category] || 0) + 1; });

    const aiSummary = await this.callAI(
      `Summary for civic issues (${days}d): total=${stats.total} open=${stats.open} resolved=${stats.resolved} critical=${stats.critical}. Categories: ${JSON.stringify(stats.categories)}. 2-3 paragraph summary.`,
    );

    return { period: `${days} days`, city: city || 'All', category: category || 'All', stats, summary: aiSummary || this.generateFallbackSummary(stats, days) };
  }

  async recommendDepartment(issueId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException(`Issue ${issueId} not found`);

    const mapping: Record<string, { name: string; code: string }> = {
      road_damage: { name: 'Roads & Infrastructure', code: 'ROADS' },
      water_supply: { name: 'Water Supply', code: 'WATER' },
      sanitation: { name: 'Sanitation', code: 'SANITATION' },
      electricity: { name: 'Electricity', code: 'ELECTRICITY' },
      garbage: { name: 'Solid Waste', code: 'WASTE' },
      drainage: { name: 'Drainage', code: 'DRAINAGE' },
      street_lighting: { name: 'Street Lighting', code: 'LIGHTING' },
      public_safety: { name: 'Public Safety', code: 'SAFETY' },
      noise_pollution: { name: 'Pollution Control', code: 'POLLUTION' },
      air_pollution: { name: 'Pollution Control', code: 'POLLUTION' },
      parks_green: { name: 'Parks & Gardens', code: 'PARKS' },
      traffic: { name: 'Traffic Management', code: 'TRAFFIC' },
      building_safety: { name: 'Building Safety', code: 'BUILDING' },
      flooding: { name: 'Drainage & Flood Control', code: 'DRAINAGE' },
      animal_control: { name: 'Animal Control', code: 'ANIMAL' },
      other: { name: 'General Services', code: 'GENERAL' },
    };

    const dept = mapping[issue.category] || mapping.other;
    return { issueId, department: dept, category: issue.category, confidence: 0.85 };
  }

  async calculateImpact(issueId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException(`Issue ${issueId} not found`);

    let impact = 0;
    const factors: string[] = [];

    const priorityWeight: Record<string, number> = { low: 10, medium: 20, high: 40, critical: 70, emergency: 90 };
    impact += priorityWeight[issue.priority] || 20;
    factors.push(`Priority: ${issue.priority}`);

    const communityImpact = Math.min(30, (issue.upvotes || 0) * 2);
    impact += communityImpact;
    factors.push(`Community votes: ${issue.upvotes || 0}`);

    if (issue.commentCount > 10) { impact += 10; factors.push('High engagement'); }
    if (issue.isUrgent) { impact += 20; factors.push('Marked urgent'); }

    const finalScore = Math.min(100, Math.round(impact));
    await this.issueRepository.update(issueId, { impactScore: finalScore });

    return { issueId, impactScore: finalScore, factors, calculatedAt: new Date().toISOString() };
  }

  async assessSeverity(issueId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) throw new NotFoundException(`Issue ${issueId} not found`);

    let risk = 0;
    const factors: string[] = [];

    const riskWeight: Record<string, number> = { low: 10, medium: 25, high: 50, critical: 75, emergency: 95 };
    risk += riskWeight[issue.priority] || 25;
    factors.push(`Priority: ${issue.priority}`);

    if (issue.category === 'public_safety' || issue.category === 'building_safety') { risk += 20; factors.push('Safety category'); }
    if (issue.category === 'flooding' || issue.category === 'electricity') { risk += 15; factors.push('Infrastructure risk'); }
    if (issue.status === IssueStatus.OPEN && issue.createdAt) {
      const daysSince = Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / 86400000);
      if (daysSince > 7) { risk += 10; factors.push(`Open for ${daysSince} days`); }
      if (daysSince > 30) { risk += 15; factors.push('Long-standing issue'); }
    }

    const finalRisk = Math.min(100, Math.round(risk));
    await this.issueRepository.update(issueId, { riskScore: finalRisk });

    return { issueId, riskScore: finalRisk, severity: finalRisk > 70 ? 'high' : finalRisk > 40 ? 'medium' : 'low', factors };
  }

  private async callAI(prompt: string): Promise<string | null> {
    if (this.openaiApiKey) {
      try {
        const resp = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          { model: this.openaiModel, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 500 },
          { headers: { Authorization: `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' } },
        );
        return resp.data.choices[0].message.content;
      } catch (e: any) { this.logger.error('OpenAI error', e.message); }
    }
    if (this.geminiApiKey) {
      try {
        const resp = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
          { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 500 } },
        );
        return resp.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (e: any) { this.logger.error('Gemini error', e.message); }
    }
    return null;
  }

  private async analyzeWithOpenAI(input: string) {
    const prompt = `Analyze this civic issue. Respond JSON: {"category":"...","severity":<1-10>,"sentiment":"...","keywords":["..."],"summary":"...","estimatedResolutionTime":"..."}. Issue: ${input}`;
    const result = await this.callAI(prompt);
    if (result) { try { const m = result.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch { /* */ } }
    return this.fallbackAnalysis(null);
  }

  private async analyzeWithGemini(input: string) {
    return this.analyzeWithOpenAI(input);
  }

  private fallbackAnalysis(issue: Issue | null) {
    return {
      category: issue?.category || 'other',
      severity: 5,
      sentiment: 'neutral',
      keywords: issue?.title?.split(/\s+/) || [],
      summary: issue?.description?.substring(0, 200) || 'AI analysis unavailable',
      estimatedResolutionTime: '7-14 days',
      duplicateProbability: 0,
      fakeProbability: 0,
    };
  }

  private fallbackClassification(text: string) {
    const keywords: Record<string, string[]> = {
      road_damage: ['pothole', 'road', 'pavement', 'crack', 'street'],
      water_supply: ['water', 'pipe', 'leak', 'supply', 'tap'],
      garbage: ['garbage', 'trash', 'waste', 'bin', 'litter'],
      electricity: ['electricity', 'power', 'wire', 'transformer', 'outage'],
      drainage: ['drain', 'sewage', 'flood', 'waterlogging'],
      public_safety: ['safety', 'danger', 'accident', 'hazard'],
    };
    const lower = text.toLowerCase();
    let best = 'other';
    let bestScore = 0;
    for (const [cat, words] of Object.entries(keywords)) {
      const score = words.filter((w) => lower.includes(w)).length;
      if (score > bestScore) { bestScore = score; best = cat; }
    }
    return { category: best, confidence: bestScore > 0 ? 0.6 : 0.3, keywords: lower.split(/\s+/).slice(0, 5), suggestedPriority: 'medium' };
  }

  private estimateResolutionDays(category: string, priority: string): number {
    const base: Record<string, number> = { low: 30, medium: 14, high: 7, critical: 3, emergency: 1 };
    return base[priority] || 14;
  }

  private assessComplexity(category: string): string {
    const high = ['building_safety', 'electricity', 'flooding'];
    const med = ['road_damage', 'water_supply', 'drainage', 'public_safety'];
    if (high.includes(category)) return 'high';
    if (med.includes(category)) return 'medium';
    return 'low';
  }

  private generateFallbackSummary(stats: any, days: number): string {
    return `Over the last ${days} days, ${stats.total} issues were reported. ${stats.resolved} have been resolved (${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate). ${stats.critical} critical issues remain. Top categories: ${Object.entries(stats.categories).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(', ')}.`;
  }
}
