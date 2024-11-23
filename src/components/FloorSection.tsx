import React, { useMemo } from 'react';
import { Building } from 'lucide-react';
import type { Floor, CleaningTask } from '../types';
import CleaningForm from './CleaningForm';
import ComplimentMessage from './ComplimentMessage';

interface Props {
  floor: Floor;
  tasks: CleaningTask[];
  onSaveTask: (task: Omit<CleaningTask, 'id'>) => void;
  staffName: string;
}

export default function FloorSection({ floor, tasks, onSaveTask, staffName }: Props) {
  // Get the last cleaning time for each room
  const lastCleaningTimes = useMemo(() => {
    const times: { [key: string]: string } = {};
    tasks.forEach(task => {
      const currentDateTime = `${task.date}T${task.time}`;
      if (!times[task.roomNumber] || currentDateTime > times[task.roomNumber]) {
        times[task.roomNumber] = currentDateTime;
      }
    });
    return times;
  }, [tasks]);

  // Get tasks for this specific floor from the last 12 hours
  const floorTasks = useMemo(() => {
    const floorPrefix = floor.id === 'eg' ? '1' : // EG starts with 1
                       floor.id === '1og' ? '2' : // 1.OG starts with 2
                       floor.id === '2og' ? '3' : // 2.OG starts with 3
                       '4'; // 3.OG starts with 4
    
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    return tasks.filter(task => {
      const taskDateTime = new Date(`${task.date}T${task.time}`);
      return task.roomNumber.startsWith(floorPrefix) && taskDateTime >= twelveHoursAgo;
    });
  }, [tasks, floor.id]);

  // Get unique completed rooms on this floor
  const completedRooms = useMemo(() => {
    return new Set(floorTasks.map(task => task.roomNumber));
  }, [floorTasks]);

  // Check if all rooms in this floor are completed
  const isFloorComplete = useMemo(() => {
    return floor.rooms.every(room => completedRooms.has(room));
  }, [floor.rooms, completedRooms]);

  return (
    <section className="mb-8">
      <ComplimentMessage show={isFloorComplete} floorName={floor.name} />
      
      <div className="flex items-center gap-2 mb-6">
        <Building className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">{floor.name}</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {floor.rooms.map(roomNumber => (
          <CleaningForm
            key={roomNumber}
            roomNumber={roomNumber}
            onSave={onSaveTask}
            completedToday={completedRooms.has(roomNumber)}
            staffName={staffName}
            lastCleaningTime={lastCleaningTimes[roomNumber]}
          />
        ))}
      </div>
    </section>
  );
}