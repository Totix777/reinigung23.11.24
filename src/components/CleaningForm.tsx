import React, { useState, useRef, useEffect } from 'react';
import { ClipboardList, Save, CheckCircle2, AlertCircle, Camera, X, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { CleaningTask } from '../types';
import { sendNotificationEmail } from '../lib/emailjs';

function formatTimeDifference(lastCleaningTime: string): string {
  const now = new Date();
  const cleaning = new Date(lastCleaningTime);
  const diffInHours = (now.getTime() - cleaning.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `vor ${minutes} Minuten`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `vor ${hours} Stunden`;
  } else {
    const days = Math.floor(diffInHours / 24);
    return `vor ${days} Tagen`;
  }
}

const BATHROOM_NOTES = {
  'Verbrauchsmaterial': [
    'Papier nachfüllen',
    'Batterie wechseln Papierspender',
    'Seife nachfüllen',
    'Desinfektionsmittel nachfüllen',
    'Handtücher nachfüllen'
  ]
};

const REGULAR_NOTES = {
  'Reparaturen': [
    'Defekte Beleuchtung',
    'Verstopfter Abfluss',
    'Defekte Steckdose',
    'Heizung funktioniert nicht',
    'Toilette verstopft',
    'Toilettendeckel defekt - Austausch nötig',
    'Wasserhahn tropft',
  ],
  'Malerarbeiten': [
    'Wand muss gestrichen werden',
    'Decke muss gestrichen werden',
    'Feuchtigkeitsflecken',
    'Tapete löst sich',
  ],
  'Sonstiges': [
    'Fenster undicht',
    'Tür klemmt',
    'Rolladen defekt',
    'Schrank beschädigt',
  ]
};

interface Props {
  roomNumber: string;
  onSave: (task: Omit<CleaningTask, 'id'>) => void;
  completedToday: boolean;
  staffName: string;
  lastCleaningTime?: string;
}

export default function CleaningForm({ roomNumber, onSave, completedToday: initialCompletedToday, staffName, lastCleaningTime }: Props) {
  const [completedToday, setCompletedToday] = useState(initialCompletedToday);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSpecialRoom = roomNumber === 'Gäste-WC' || 
                       roomNumber === 'Mitarbeiter-WC' || 
                       roomNumber === 'Behinderten-WC' ||
                       roomNumber === 'Pflegebad';

  const [formData, setFormData] = useState<Omit<CleaningTask, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    roomNumber,
    visualCleaning: false,
    maintenanceCleaning: false,
    basicRoomCleaning: false,
    bedCleaning: false,
    windowsCurtainsCleaning: false,
    notes: '',
    staffName,
  });

  useEffect(() => {
    if (lastCleaningTime) {
      const cleaningTime = new Date(lastCleaningTime);
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
      setCompletedToday(cleaningTime >= twelveHoursAgo);
    } else {
      setCompletedToday(false);
    }
  }, [lastCleaningTime]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files[0]) return;

    const file = files[0];
    if (file.size > 5000000) { // 5MB limit
      setError('Bild ist zu groß. Bitte wählen Sie ein kleineres Bild (max. 5MB).');
      return;
    }

    setImages([file]);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const removeImage = () => {
    setImages([]);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNoteClick = (note: string) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes ? `${prev.notes}\n${note}` : note
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sending) {
      return;
    }

    const hasSelectedCleaning = formData.visualCleaning ||
      formData.maintenanceCleaning ||
      formData.basicRoomCleaning ||
      (!isSpecialRoom && formData.bedCleaning) ||
      (!isSpecialRoom && formData.windowsCurtainsCleaning);

    if (!hasSelectedCleaning && !formData.notes.trim() && images.length === 0) {
      setError('Bitte wählen Sie mindestens eine Reinigungsart aus oder fügen Sie Notizen hinzu');
      return;
    }

    setError('');
    setSending(true);

    try {
      const cleaningTypes = [
        formData.visualCleaning && 'Sichtreinigung',
        formData.maintenanceCleaning && 'Unterhaltsreinigung',
        formData.basicRoomCleaning && 'Grundreinigung',
        !isSpecialRoom && formData.bedCleaning && 'Bett Grundreinigung',
        !isSpecialRoom && formData.windowsCurtainsCleaning && 'Fenster und Gardinen'
      ].filter(Boolean) as string[];

      if (formData.notes.trim() || images.length > 0) {
        await sendNotificationEmail({
          room_number: roomNumber,
          notes: formData.notes,
          images,
          cleaning_types: cleaningTypes,
          staff_name: staffName
        });
      }
      
      onSave({ 
        ...formData,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      });
      
      setCompletedToday(true);
      setImages([]);
      setImagePreview(null);
      setShowNotes(false);
      setLastSaved(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      
      setFormData(prev => ({
        ...prev,
        visualCleaning: false,
        maintenanceCleaning: false,
        basicRoomCleaning: false,
        bedCleaning: false,
        windowsCurtainsCleaning: false,
        notes: '',
      }));
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Fehler beim Speichern. Bitte versuchen Sie es erneut.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`p-3 rounded-lg shadow-sm relative transition-colors border ${
        completedToday
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:border-blue-200'
      }`}
    >
      {completedToday && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
      )}
      
      <div className="flex items-center gap-1 mb-2">
        <ClipboardList className={`w-5 h-5 ${completedToday ? 'text-green-600' : 'text-blue-600'}`} />
        <h3 className="text-lg font-semibold text-gray-800">{roomNumber}</h3>
      </div>

      {lastCleaningTime && (
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <Clock className="w-4 h-4" />
          <span>Letzte Reinigung: {formatTimeDifference(lastCleaningTime)}</span>
        </div>
      )}

      <div className="space-y-2 mb-3">
        <label className="flex items-center min-h-[2.5rem]">
          <input
            type="checkbox"
            checked={formData.visualCleaning}
            onChange={e => {
              setFormData(prev => ({ ...prev, visualCleaning: e.target.checked }));
              setError('');
            }}
            className="h-5 w-5 text-blue-600 rounded"
          />
          <span className="ml-2 text-base">Sichtreinigung</span>
        </label>

        <label className="flex items-center min-h-[2.5rem]">
          <input
            type="checkbox"
            checked={formData.maintenanceCleaning}
            onChange={e => {
              setFormData(prev => ({ ...prev, maintenanceCleaning: e.target.checked }));
              setError('');
            }}
            className="h-5 w-5 text-blue-600 rounded"
          />
          <span className="ml-2 text-base">Unterhaltsreinigung</span>
        </label>

        <label className="flex items-center min-h-[2.5rem]">
          <input
            type="checkbox"
            checked={formData.basicRoomCleaning}
            onChange={e => {
              setFormData(prev => ({ ...prev, basicRoomCleaning: e.target.checked }));
              setError('');
            }}
            className="h-5 w-5 text-blue-600 rounded"
          />
          <span className="ml-2 text-base">Grundreinigung</span>
        </label>

        {!isSpecialRoom && (
          <>
            <label className="flex items-center min-h-[2.5rem]">
              <input
                type="checkbox"
                checked={formData.bedCleaning}
                onChange={e => {
                  setFormData(prev => ({ ...prev, bedCleaning: e.target.checked }));
                  setError('');
                }}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <span className="ml-2 text-base">Bett Grundreinigung</span>
            </label>

            <label className="flex items-center min-h-[2.5rem]">
              <input
                type="checkbox"
                checked={formData.windowsCurtainsCleaning}
                onChange={e => {
                  setFormData(prev => ({ ...prev, windowsCurtainsCleaning: e.target.checked }));
                  setError('');
                }}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <span className="ml-2 text-base">Fenster und Gardinen</span>
            </label>
          </>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full px-4 py-2 text-base bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <span>Notizen</span>
            {showNotes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showNotes && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-4">
              {isSpecialRoom && Object.entries(BATHROOM_NOTES).map(([category, notes]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                  <ul className="grid grid-cols-1 gap-1">
                    {notes.map((note, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          onClick={() => handleNoteClick(note)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-200 rounded-md flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                          {note}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {Object.entries(REGULAR_NOTES).map(([category, notes]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                  <ul className="grid grid-cols-1 gap-1">
                    {notes.map((note, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          onClick={() => handleNoteClick(note)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-200 rounded-md flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                          {note}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <textarea
                value={formData.notes}
                onChange={e => {
                  setFormData(prev => ({ ...prev, notes: e.target.value }));
                  setError('');
                }}
                placeholder="Weitere Notizen"
                rows={3}
                className="w-full text-base rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mt-2"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-base bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Camera className="w-5 h-5" />
              Foto aufnehmen
            </button>
          </div>

          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Vorschau"
                className="w-32 h-32 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-1 -right-1 bg-red-100 rounded-full p-1 hover:bg-red-200"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-base my-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className={`w-full flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-md text-base mt-3 ${
          sending
            ? 'bg-gray-400 cursor-not-allowed'
            : completedToday
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <Save className="w-5 h-5" />
          <span>
            {sending ? 'Wird gespeichert...' : completedToday ? 'Erneut reinigen' : 'Speichern'}
          </span>
        </div>
        {lastSaved && (
          <div className="text-xs opacity-80 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Zuletzt gespeichert: {lastSaved}</span>
          </div>
        )}
      </button>
    </form>
  );
}