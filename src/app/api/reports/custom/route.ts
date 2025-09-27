import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

interface CustomReportRequest {
  name: string;
  description?: string;
  config: {
    metrics: string[];
    filters: any[];
    groupBy: string[];
    dateRange: {
      start: string;
      end: string;
      preset?: string;
    };
    chartType: 'line' | 'bar' | 'pie' | 'table' | 'metric';
    schedule?: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
    };
  };
}

// GET /api/reports/custom - Get user's custom reports
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const reportId = searchParams.get('id');

      if (reportId) {
        // Get specific report
        const reportQuery = `
          SELECT * FROM custom_reports 
          WHERE id = $1 AND (user_id = $2 OR is_public = true)
        `;
        const report = await neonClient.sql(reportQuery, [reportId, user.id]);

        if (report.length === 0) {
          return NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          );
        }

        // Generate report data
        const reportData = await generateReportData(report[0].config, user);

        return NextResponse.json({
          success: true,
          report: {
            ...report[0],
            data: reportData,
          },
        });
      } else {
        // Get all user reports
        const reportsQuery = `
          SELECT 
            id,
            name,
            description,
            config,
            is_public,
            created_at,
            updated_at,
            last_generated_at
          FROM custom_reports 
          WHERE user_id = $1 OR is_public = true
          ORDER BY created_at DESC
        `;
        const reports = await neonClient.sql(reportsQuery, [user.id]);

        return NextResponse.json({
          success: true,
          reports,
        });
      }
    } catch (error: any) {
      console.error('Error getting custom reports:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get reports' },
        { status: 500 }
      );
    }
  }
);

// POST /api/reports/custom - Create a new custom report
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const {
        name,
        description,
        config,
      }: CustomReportRequest = await req.json();

      if (!name || !config) {
        return NextResponse.json(
          { error: 'Name and config are required' },
          { status: 400 }
        );
      }

      // Validate config
      const validationError = validateReportConfig(config);
      if (validationError) {
        return NextResponse.json(
          { error: validationError },
          { status: 400 }
        );
      }

      // Create the report
      const insertQuery = `
        INSERT INTO custom_reports (
          user_id,
          name,
          description,
          config
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await neonClient.sql(insertQuery, [
        user.id,
        name,
        description || '',
        JSON.stringify(config),
      ]);

      const report = result[0];

      // Generate initial report data
      const reportData = await generateReportData(config, user);

      // Update last_generated_at
      await neonClient.sql(
        'UPDATE custom_reports SET last_generated_at = NOW() WHERE id = $1',
        [report.id]
      );

      return NextResponse.json({
        success: true,
        report: {
          ...report,
          data: reportData,
        },
        message: 'Custom report created successfully',
      });
    } catch (error: any) {
      console.error('Error creating custom report:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create report' },
        { status: 500 }
      );
    }
  }
);

// PUT /api/reports/custom - Update a custom report
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { id, name, description, config } = await req.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Verify ownership
      const ownershipQuery = `
        SELECT id FROM custom_reports 
        WHERE id = $1 AND user_id = $2
      `;
      const ownership = await neonClient.sql(ownershipQuery, [id, user.id]);

      if (ownership.length === 0) {
        return NextResponse.json(
          { error: 'Report not found or access denied' },
          { status: 404 }
        );
      }

      // Validate config if provided
      if (config) {
        const validationError = validateReportConfig(config);
        if (validationError) {
          return NextResponse.json(
            { error: validationError },
            { status: 400 }
          );
        }
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(name);
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(description);
        paramIndex++;
      }

      if (config !== undefined) {
        updateFields.push(`config = $${paramIndex}`);
        updateValues.push(JSON.stringify(config));
        paramIndex++;
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const updateQuery = `
        UPDATE custom_reports 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await neonClient.sql(updateQuery, updateValues);

      return NextResponse.json({
        success: true,
        report: result[0],
        message: 'Report updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating custom report:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update report' },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/reports/custom - Delete a custom report
export const DELETE = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Verify ownership and delete
      const deleteQuery = `
        DELETE FROM custom_reports 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await neonClient.sql(deleteQuery, [id, user.id]);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Report not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting custom report:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete report' },
        { status: 500 }
      );
    }
  }
);

// Validate report configuration
function validateReportConfig(config: any): string | null {
  if (!config.metrics || !Array.isArray(config.metrics) || config.metrics.length === 0) {
    return 'At least one metric is required';
  }

  if (!config.dateRange || !config.dateRange.start || !config.dateRange.end) {
    return 'Date range is required';
  }

  const validChartTypes = ['line', 'bar', 'pie', 'table', 'metric'];
  if (!config.chartType || !validChartTypes.includes(config.chartType)) {
    return 'Valid chart type is required';
  }

  const validMetrics = [
    'sales_count', 'revenue', 'unique_buyers', 'avg_order_value',
    'active_users', 'new_users', 'app_submissions', 'reviews_count',
    'downloads', 'rating_average', 'conversion_rate'
  ];

  for (const metric of config.metrics) {
    if (!validMetrics.includes(metric)) {
      return `Invalid metric: ${metric}`;
    }
  }

  return null;
}

// Generate report data based on configuration
async function generateReportData(config: any, user: any) {
  try {
    const { metrics, filters, groupBy, dateRange, chartType } = config;

    // Build base query
    let query = buildReportQuery(metrics, filters, groupBy, dateRange, user);
    
    // Execute query
    const data = await neonClient.sql(query.sql, query.params);

    // Process data based on chart type
    const processedData = processReportData(data, metrics, chartType, groupBy);

    return {
      data: processedData,
      metadata: {
        total_records: data.length,
        generated_at: new Date().toISOString(),
        query_time: Date.now(),
      },
    };
  } catch (error) {
    console.error('Error generating report data:', error);
    throw new Error('Failed to generate report data');
  }
}

// Build SQL query based on report configuration
function buildReportQuery(metrics: string[], filters: any[], groupBy: string[], dateRange: any, user: any) {
  let sql = 'SELECT ';
  const params: any[] = [];
  let paramIndex = 1;

  // Add date grouping if specified
  if (groupBy.includes('date')) {
    sql += 'DATE(p.created_at) as date, ';
  }
  if (groupBy.includes('week')) {
    sql += 'DATE_TRUNC(\'week\', p.created_at) as week, ';
  }
  if (groupBy.includes('month')) {
    sql += 'DATE_TRUNC(\'month\', p.created_at) as month, ';
  }

  // Add category grouping
  if (groupBy.includes('category')) {
    sql += 'a.category, ';
  }

  // Add platform grouping
  if (groupBy.includes('platform')) {
    sql += 'UNNEST(a.platforms) as platform, ';
  }

  // Add metrics
  const metricSelects = [];
  if (metrics.includes('sales_count')) {
    metricSelects.push('COUNT(p.id) as sales_count');
  }
  if (metrics.includes('revenue')) {
    metricSelects.push('SUM(p.amount) as revenue');
  }
  if (metrics.includes('unique_buyers')) {
    metricSelects.push('COUNT(DISTINCT p.user_id) as unique_buyers');
  }
  if (metrics.includes('avg_order_value')) {
    metricSelects.push('AVG(p.amount) as avg_order_value');
  }
  if (metrics.includes('downloads')) {
    metricSelects.push('COUNT(dl.id) as downloads');
  }
  if (metrics.includes('rating_average')) {
    metricSelects.push('AVG(a.rating_average) as rating_average');
  }

  sql += metricSelects.join(', ');

  // FROM clause
  sql += ' FROM purchases p';
  sql += ' JOIN apps a ON p.app_id = a.id';
  sql += ' JOIN users u ON a.developer_id = u.id';
  
  if (metrics.includes('downloads')) {
    sql += ' LEFT JOIN download_logs dl ON a.id = dl.app_id';
  }

  // WHERE clause
  const whereConditions = ['p.status = \'completed\''];

  // Date range filter
  whereConditions.push(`p.created_at >= $${paramIndex}`);
  params.push(dateRange.start);
  paramIndex++;

  whereConditions.push(`p.created_at <= $${paramIndex}`);
  params.push(dateRange.end);
  paramIndex++;

  // Role-based filtering
  if (user.role === 'developer') {
    whereConditions.push(`a.developer_id = $${paramIndex}`);
    params.push(user.id);
    paramIndex++;
  }

  // Additional filters
  filters.forEach((filter: any) => {
    if (filter.field === 'category' && filter.value) {
      whereConditions.push(`a.category = $${paramIndex}`);
      params.push(filter.value);
      paramIndex++;
    }
    if (filter.field === 'platform' && filter.value) {
      whereConditions.push(`$${paramIndex} = ANY(a.platforms)`);
      params.push(filter.value);
      paramIndex++;
    }
    if (filter.field === 'price_min' && filter.value) {
      whereConditions.push(`a.price >= $${paramIndex}`);
      params.push(filter.value * 100); // Convert to cents
      paramIndex++;
    }
    if (filter.field === 'price_max' && filter.value) {
      whereConditions.push(`a.price <= $${paramIndex}`);
      params.push(filter.value * 100); // Convert to cents
      paramIndex++;
    }
  });

  sql += ' WHERE ' + whereConditions.join(' AND ');

  // GROUP BY clause
  if (groupBy.length > 0) {
    const groupByFields = [];
    if (groupBy.includes('date')) groupByFields.push('DATE(p.created_at)');
    if (groupBy.includes('week')) groupByFields.push('DATE_TRUNC(\'week\', p.created_at)');
    if (groupBy.includes('month')) groupByFields.push('DATE_TRUNC(\'month\', p.created_at)');
    if (groupBy.includes('category')) groupByFields.push('a.category');
    if (groupBy.includes('platform')) groupByFields.push('UNNEST(a.platforms)');

    if (groupByFields.length > 0) {
      sql += ' GROUP BY ' + groupByFields.join(', ');
    }
  }

  // ORDER BY clause
  if (groupBy.includes('date')) {
    sql += ' ORDER BY DATE(p.created_at)';
  } else if (groupBy.includes('week')) {
    sql += ' ORDER BY DATE_TRUNC(\'week\', p.created_at)';
  } else if (groupBy.includes('month')) {
    sql += ' ORDER BY DATE_TRUNC(\'month\', p.created_at)';
  } else {
    sql += ' ORDER BY sales_count DESC';
  }

  return { sql, params };
}

// Process raw data based on chart type
function processReportData(data: any[], metrics: string[], chartType: string, groupBy: string[]) {
  if (chartType === 'table') {
    return data;
  }

  if (chartType === 'metric') {
    // Return summary metrics
    const summary = {};
    metrics.forEach(metric => {
      if (metric === 'sales_count') {
        summary[metric] = data.reduce((sum, row) => sum + (row.sales_count || 0), 0);
      } else if (metric === 'revenue') {
        summary[metric] = data.reduce((sum, row) => sum + (row.revenue || 0), 0);
      } else if (metric === 'unique_buyers') {
        summary[metric] = data.reduce((sum, row) => sum + (row.unique_buyers || 0), 0);
      } else if (metric === 'avg_order_value') {
        const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0);
        const totalSales = data.reduce((sum, row) => sum + (row.sales_count || 0), 0);
        summary[metric] = totalSales > 0 ? totalRevenue / totalSales : 0;
      }
    });
    return summary;
  }

  if (chartType === 'pie') {
    // For pie charts, use the first groupBy field as the label
    const labelField = groupBy[0] || 'category';
    const valueField = metrics[0] || 'sales_count';
    
    return data.map(row => ({
      name: row[labelField] || 'Unknown',
      value: row[valueField] || 0,
    }));
  }

  // For line and bar charts, return data as-is
  return data;
}
