import { createDemoTimeSeries } from '../../data/mockData'
import type { DataConfiguration, TimeSeriesDataset } from '../../types'

export interface DataSourceAdapter {
  id: string
  load(configuration: DataConfiguration): TimeSeriesDataset
}

const demoAdapter: DataSourceAdapter = {
  id: 'local-demo',
  load(configuration) {
    const points = createDemoTimeSeries(configuration.regionId)
      .filter((point) => point.date >= configuration.timeRange.startDate && point.date <= configuration.timeRange.endDate)
    return {
      points,
      sourceId: 'local-demo',
      isDemonstration: true,
      missingValueCount: 0,
    }
  },
}

const adapters: DataSourceAdapter[] = [demoAdapter]

export function getDataSourceAdapter(sourceId: string): DataSourceAdapter | undefined {
  return adapters.find((adapter) => adapter.id === sourceId)
}
