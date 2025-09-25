import connectToDatabase from '../mongodb/mongodb';
import {
  AnalyticsOverview,
  DailyVisitor,
  AppPerformance,
  PlatformDistribution,
  RegionData,
  MonthlyRevenue,
  FeedbackAnalytics,
  RatingDistribution,
  FeedbackByCategory,
  FeedbackTrend,
  RatingTrend,
  ResponseTime
} from '../mongodb/models/analytics';

// Helper function to get date range based on timeframe
export const getDateRange = (timeframe: string): { startDate: Date, endDate: Date } => {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (timeframe) {
    case '7days':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90days':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30); // Default to 30 days
  }
  
  return { startDate, endDate };
};

// Get overall analytics for a developer
export const getDeveloperAnalytics = async (developerId: string, timeframe: string) => {
  await connectToDatabase();
  const { startDate, endDate } = getDateRange(timeframe);
  
  try {
    // Get the latest analytics overview
    const overview = await AnalyticsOverview.findOne({
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 }).lean();
    
    // Get platform distribution
    const platformDistribution = await PlatformDistribution.find({
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
    
    // Get region data
    const regionData = await RegionData.find({
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
    
    // Get monthly revenue
    const monthlyRevenue = await MonthlyRevenue.find({
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).sort('date').lean();
    
    // Get app performance
    const appPerformance = await AppPerformance.find({
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
    
    // Get daily visitors
    const dailyVisitors = await DailyVisitor.aggregate([
      {
        $match: {
          developerId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          visitors: { $sum: "$visitors" }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          visitors: 1,
          _id: 0
        }
      }
    ]);
    
    return {
      overview: overview || {
        totalUsers: 0,
        totalRevenue: 0,
        averageRating: 0,
        conversionRate: 0,
        activeUsers: 0
      },
      platformDistribution: platformDistribution || [],
      regionData: regionData || [],
      monthlyRevenue: monthlyRevenue || [],
      appPerformance: appPerformance || [],
      dailyVisitors: dailyVisitors || []
    };
  } catch (error) {
    console.error('Error fetching developer analytics:', error);
    throw error;
  }
};

// Get app-specific analytics
export const getAppAnalytics = async (appId: string, developerId: string, timeframe: string) => {
  await connectToDatabase();
  const { startDate, endDate } = getDateRange(timeframe);
  
  try {
    // Get app performance
    const appPerformance = await AppPerformance.findOne({
      appId,
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 }).lean();
    
    // Get daily visitors for the app
    const dailyVisitors = await DailyVisitor.find({
      appId,
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).sort('date').lean();
    
    // Get platform distribution for the app
    const platformDistribution = await PlatformDistribution.find({
      appId,
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
    
    // Get region data for the app
    const regionData = await RegionData.find({
      appId,
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();
    
    // Get monthly revenue for the app
    const monthlyRevenue = await MonthlyRevenue.find({
      appId,
      developerId,
      date: { $gte: startDate, $lte: endDate }
    }).sort('date').lean();
    
    return {
      appPerformance: appPerformance || {
        name: '',
        users: 0,
        revenue: 0,
        rating: 0
      },
      dailyVisitors: dailyVisitors || [],
      platformDistribution: platformDistribution || [],
      regionData: regionData || [],
      monthlyRevenue: monthlyRevenue || []
    };
  } catch (error) {
    console.error('Error fetching app analytics:', error);
    throw error;
  }
};

// Get feedback analytics
export const getFeedbackAnalytics = async (developerId: string, appId?: string, timeframe?: string) => {
  await connectToDatabase();
  const { startDate, endDate } = getDateRange(timeframe || '30days');
  
  try {
    // Base query
    const baseQuery: any = {
      developerId,
      date: { $gte: startDate, $lte: endDate }
    };
    
    // Add appId to query if provided
    if (appId) {
      baseQuery.appId = appId;
    }
    
    // Get feedback analytics overview
    const overview = await FeedbackAnalytics.findOne(baseQuery)
      .sort({ date: -1 })
      .lean();
    
    // Get rating distribution
    const ratingDistribution = await RatingDistribution.find(baseQuery).lean();
    
    // Get feedback by category
    const feedbackByCategory = await FeedbackByCategory.find(baseQuery).lean();
    
    // Get feedback by app (only if no specific app is requested)
    let feedbackByApp = [];
    if (!appId) {
      feedbackByApp = await FeedbackAnalytics.aggregate([
        {
          $match: {
            developerId,
            date: { $gte: startDate, $lte: endDate },
            appId: { $exists: true }
          }
        },
        {
          $group: {
            _id: "$appId",
            totalFeedback: { $sum: "$totalFeedback" },
            averageRating: { $avg: "$averageRating" }
          }
        },
        {
          $lookup: {
            from: "apps",
            localField: "_id",
            foreignField: "_id",
            as: "appInfo"
          }
        },
        {
          $project: {
            appId: "$_id",
            name: { $arrayElemAt: ["$appInfo.name", 0] },
            totalFeedback: 1,
            averageRating: 1,
            _id: 0
          }
        }
      ]);
    }
    
    // Get feedback trend
    const feedbackTrend = await FeedbackTrend.find(baseQuery)
      .sort('date')
      .lean();
    
    // Get rating trend
    const ratingTrend = await RatingTrend.find(baseQuery)
      .sort('date')
      .lean();
    
    // Get response time
    const responseTime = await ResponseTime.find(baseQuery)
      .sort('date')
      .lean();
    
    return {
      overview: overview || {
        totalFeedback: 0,
        averageRating: 0,
        responseRate: 0,
        resolutionRate: 0,
        openIssues: 0
      },
      ratingDistribution: ratingDistribution || [],
      feedbackByCategory: feedbackByCategory || [],
      feedbackByApp: feedbackByApp || [],
      feedbackTrend: feedbackTrend || [],
      ratingTrend: ratingTrend || [],
      responseTime: responseTime || []
    };
  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    throw error;
  }
};
