import React from 'react';
import { History, FileSpreadsheet, ClipboardList } from 'lucide-react';
import type { CleaningTask } from '../types';
import { exportToCSV } from '../utils/exportToExcel';

interface Props {
  tasks: CleaningTask[];
}

export default function TaskHistory({ tasks }: Props) {
  // Show tasks from the last 12 hours
  const twelveHoursAgo = new Date();
  twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
  
  const recentTasks = tasks.filter(task => {
    const taskDateTime = new Date(`${task.date}T${task.time}`);
    return taskDateTime >= twelveHoursAgo;
  });
  
  const stats = {
    recent: recentTasks.length,
    byFloor: {
      'EG': recentTasks.filter(t => t.roomNumber.startsWith('1')).length,
      '1.OG': recentTasks.filter(t => t.roomNumber.startsWith('2')).length,
      '2.OG': recentTasks.filter(t => t.roomNumber.startsWith('3')).length,
      '3.OG': recentTasks.filter(t => t.roomNumber.startsWith('4')).length,
    }
  };

  const handleExport = () => {
    exportToCSV(tasks, `reinigungsverlauf-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ClipboardList className="w-5 h-5" />
            <h3 className="font-semibold">Letzte 12 Stunden</h3>
          </div>
          <p className="text-2xl font-bold">{stats.recent} Räume</p>
        </div>
        
        {Object.entries(stats.byFloor).map(([floor, count]) => (
          <div key={floor} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <ClipboardList className="w-5 h-5" />
              <h3 className="font-semibold">{floor}</h3>
            </div>
            <p className="text-2xl font-bold">{count} Räume</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Letzte Reinigungen</h2>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Als Excel exportieren
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uhrzeit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zimmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mitarbeiter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reinigungsart</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notizen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTasks
                .sort((a, b) => {
                  const dateA = new Date(`${a.date}T${a.time}`);
                  const dateB = new Date(`${b.date}T${b.time}`);
                  return dateB.getTime() - dateA.getTime();
                })
                .map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.roomNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.staffName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <ul className="list-disc list-inside">
                        {task.visualCleaning && <li>Sichtreinigung</li>}
                        {task.maintenanceCleaning && <li>Unterhaltsreinigung</li>}
                        {task.basicRoomCleaning && <li>Zimmer Grundreinigung</li>}
                        {task.bedCleaning && <li>Bett Grundreinigung</li>}
                        {task.windowsCurtainsCleaning && <li>Fenster und Gardinen</li>}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{task.notes}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}