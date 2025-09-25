import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for our analytics data
export interface IAnalyticsOverview extends Document {
  totalUsers: number;
  totalRevenue: number;
  averageRating: number;
  conversionRate: number;
  activeUsers: number;
  date: Date;
  developerId: string;
}

export interface IDailyVisitor extends Document {
  date: Date;
  visitors: number;
  appId: string;
  developerId: string;
}

export interface IAppPerformance extends Document {
  appId: string;
  name: string;
  users: number;
  revenue: number;
  rating: number;
  date: Date;
  developerId: string;
}

export interface IPlatformDistribution extends Document {
  name: string;
  value: number;
  date: Date;
  appId?: string;
  developerId: string;
}

export interface IRegionData extends Document {
  name: string;
  value: number;
  date: Date;
  appId?: string;
  developerId: string;
}

export interface IMonthlyRevenue extends Document {
  month: string;
  revenue: number;
  year: number;
  appId?: string;
  developerId: string;
}

export interface IFeedbackAnalytics extends Document {
  totalFeedback: number;
  averageRating: number;
  responseRate: number;
  resolutionRate: number;
  openIssues: number;
  date: Date;
  appId?: string;
  developerId: string;
}

export interface IRatingDistribution extends Document {
  rating: number;
  count: number;
  date: Date;
  appId?: string;
  developerId: string;
}

export interface IFeedbackByCategory extends Document {
  category: string;
  count: number;
  date: Date;
  appId?: string;
  developerId: string;
}

export interface IFeedbackTrend extends Document {
  date: Date;
  count: number;
  appId?: string;
  developerId: string;
}

export interface IRatingTrend extends Document {
  date: Date;
  rating: number;
  appId?: string;
  developerId: string;
}

export interface IResponseTime extends Document {
  date: Date;
  hours: number;
  appId?: string;
  developerId: string;
}

// Define schemas
const AnalyticsOverviewSchema = new Schema<IAnalyticsOverview>({
  totalUsers: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  averageRating: { type: Number, required: true },
  conversionRate: { type: Number, required: true },
  activeUsers: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  developerId: { type: String, required: true, index: true }
});

const DailyVisitorSchema = new Schema<IDailyVisitor>({
  date: { type: Date, required: true },
  visitors: { type: Number, required: true },
  appId: { type: String, required: true, index: true },
  developerId: { type: String, required: true, index: true }
});

const AppPerformanceSchema = new Schema<IAppPerformance>({
  appId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  users: { type: Number, required: true },
  revenue: { type: Number, required: true },
  rating: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  developerId: { type: String, required: true, index: true }
});

const PlatformDistributionSchema = new Schema<IPlatformDistribution>({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const RegionDataSchema = new Schema<IRegionData>({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const MonthlyRevenueSchema = new Schema<IMonthlyRevenue>({
  month: { type: String, required: true },
  revenue: { type: Number, required: true },
  year: { type: Number, required: true },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const FeedbackAnalyticsSchema = new Schema<IFeedbackAnalytics>({
  totalFeedback: { type: Number, required: true },
  averageRating: { type: Number, required: true },
  responseRate: { type: Number, required: true },
  resolutionRate: { type: Number, required: true },
  openIssues: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const RatingDistributionSchema = new Schema<IRatingDistribution>({
  rating: { type: Number, required: true },
  count: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const FeedbackByCategorySchema = new Schema<IFeedbackByCategory>({
  category: { type: String, required: true },
  count: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const FeedbackTrendSchema = new Schema<IFeedbackTrend>({
  date: { type: Date, required: true },
  count: { type: Number, required: true },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const RatingTrendSchema = new Schema<IRatingTrend>({
  date: { type: Date, required: true },
  rating: { type: Number, required: true },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const ResponseTimeSchema = new Schema<IResponseTime>({
  date: { type: Date, required: true },
  hours: { type: Number, required: true },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

// Create models
export const AnalyticsOverview = mongoose.models.AnalyticsOverview || 
  mongoose.model<IAnalyticsOverview>('AnalyticsOverview', AnalyticsOverviewSchema);

export const DailyVisitor = mongoose.models.DailyVisitor || 
  mongoose.model<IDailyVisitor>('DailyVisitor', DailyVisitorSchema);

export const AppPerformance = mongoose.models.AppPerformance || 
  mongoose.model<IAppPerformance>('AppPerformance', AppPerformanceSchema);

export const PlatformDistribution = mongoose.models.PlatformDistribution || 
  mongoose.model<IPlatformDistribution>('PlatformDistribution', PlatformDistributionSchema);

export const RegionData = mongoose.models.RegionData || 
  mongoose.model<IRegionData>('RegionData', RegionDataSchema);

export const MonthlyRevenue = mongoose.models.MonthlyRevenue || 
  mongoose.model<IMonthlyRevenue>('MonthlyRevenue', MonthlyRevenueSchema);

export const FeedbackAnalytics = mongoose.models.FeedbackAnalytics || 
  mongoose.model<IFeedbackAnalytics>('FeedbackAnalytics', FeedbackAnalyticsSchema);

export const RatingDistribution = mongoose.models.RatingDistribution || 
  mongoose.model<IRatingDistribution>('RatingDistribution', RatingDistributionSchema);

export const FeedbackByCategory = mongoose.models.FeedbackByCategory || 
  mongoose.model<IFeedbackByCategory>('FeedbackByCategory', FeedbackByCategorySchema);

export const FeedbackTrend = mongoose.models.FeedbackTrend || 
  mongoose.model<IFeedbackTrend>('FeedbackTrend', FeedbackTrendSchema);

export const RatingTrend = mongoose.models.RatingTrend || 
  mongoose.model<IRatingTrend>('RatingTrend', RatingTrendSchema);

export const ResponseTime = mongoose.models.ResponseTime || 
  mongoose.model<IResponseTime>('ResponseTime', ResponseTimeSchema);
