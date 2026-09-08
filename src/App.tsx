import { useState } from 'react';
import type { PageId } from './types';
import DigitalTwinConsole from './pages/DigitalTwinConsole';
import BridgeCommand from './pages/BridgeCommand';
import SeaIceForecast from './pages/SeaIceForecast';
import IcebergTracking from './pages/IcebergTracking';
import Overview from './pages/Overview';
import RoutePlanner from './pages/RoutePlanner';
import RouteComparison from './pages/RouteComparison';
import { SimulationProvider } from './context/SimulationContext';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('digital-twin');

  return (
    <SimulationProvider>
      <div className="flex flex-col h-full w-full overflow-hidden bg-[#060d19] text-white">
        <main className="flex-1 overflow-hidden relative">
          {activePage === 'digital-twin' && <DigitalTwinConsole />}
          {activePage === 'bridge' && <BridgeCommand />}
          {activePage === 'sea-ice' && <SeaIceForecast />}
          {activePage === 'icebergs' && <IcebergTracking />}
          {activePage === 'overview' && <Overview onNavigate={setActivePage} />}
          {activePage === 'route-planner' && <RoutePlanner />}
          {activePage === 'route-comparison' && <RouteComparison />}
        </main>
      </div>
    </SimulationProvider>
  );
}
