import * as XLSX from 'xlsx-js-style';

export function exportToCSV(tasks: any[], filename: string) {
  try {
    // Sort tasks by floor and date
    const sortedTasks = [...tasks].sort((a, b) => {
      const floorA = a.roomNumber[0];
      const floorB = b.roomNumber[0];
      if (floorA !== floorB) return floorA.localeCompare(floorB);
      
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    // Group tasks by floor
    const floors: { [key: string]: any[] } = {
      '1': [], // EG
      '2': [], // 1.OG
      '3': [], // 2.OG
      '4': []  // 3.OG
    };

    sortedTasks.forEach(task => {
      const floor = task.roomNumber[0];
      if (floors[floor]) {
        floors[floor].push(task);
      }
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Headers with styling
    const headers = [
      'Datum',
      'Uhrzeit',
      'Zimmer',
      'Mitarbeiter',
      'Sichtreinigung',
      'Unterhaltsreinigung',
      'Zimmer Grundreinigung',
      'Bett Grundreinigung',
      'Fenster und Gardinen',
      'Notizen'
    ];

    // Column widths for all sheets
    const colWidths = [
      { wch: 12 }, // Datum
      { wch: 10 }, // Uhrzeit
      { wch: 10 }, // Zimmer
      { wch: 15 }, // Mitarbeiter
      { wch: 12 }, // Sichtreinigung
      { wch: 15 }, // Unterhaltsreinigung
      { wch: 15 }, // Zimmer Grundreinigung
      { wch: 15 }, // Bett Grundreinigung
      { wch: 15 }, // Fenster und Gardinen
      { wch: 40 }  // Notizen
    ];

    // Header style
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EDF2F7" } },
      alignment: { horizontal: 'center' }
    };

    // Create a worksheet for each floor
    const floorNames = {
      '1': 'EG Schlosspark',
      '2': '1.OG Ebertpark',
      '3': '2.OG Rheinufer',
      '4': '3.OG An den Seen'
    };

    Object.entries(floors).forEach(([floor, floorTasks]) => {
      const wsData: any[][] = [];
      
      // Add title with styling
      wsData.push([{
        v: `DRK Pflegeheim - ${floorNames[floor as keyof typeof floorNames]}`,
        t: 's',
        s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } }
      }]);
      wsData.push([]); // Empty row after title

      // Add headers with styling
      wsData.push(headers.map(header => ({
        v: header,
        t: 's',
        s: headerStyle
      })));

      // Add tasks for this floor
      floorTasks.forEach(task => {
        wsData.push([
          { v: task.date, t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.time, t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.roomNumber, t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.staffName, t: 's' },
          { v: task.visualCleaning ? 'X' : '', t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.maintenanceCleaning ? 'X' : '', t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.basicRoomCleaning ? 'X' : '', t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.bedCleaning ? 'X' : '', t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.windowsCurtainsCleaning ? 'X' : '', t: 's', s: { alignment: { horizontal: 'center' } } },
          { v: task.notes, t: 's', s: { alignment: { wrapText: true } } }
        ]);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, floorNames[floor as keyof typeof floorNames]);
    });

    // Create a summary sheet
    const summaryData: any[][] = [];
    
    // Add title to summary
    summaryData.push([{
      v: 'DRK Pflegeheim - Reinigungsübersicht',
      t: 's',
      s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } }
    }]);
    summaryData.push([]); // Empty row

    // Add summary headers
    summaryData.push([
      { v: 'Wohnbereich', t: 's', s: headerStyle },
      { v: 'Anzahl Reinigungen', t: 's', s: headerStyle },
      { v: 'Letzte Reinigung', t: 's', s: headerStyle }
    ]);

    // Add summary data
    Object.entries(floors).forEach(([floor, floorTasks]) => {
      const lastCleaning = floorTasks[0];
      summaryData.push([
        { v: floorNames[floor as keyof typeof floorNames], t: 's' },
        { v: floorTasks.length, t: 'n', s: { alignment: { horizontal: 'center' } } },
        { 
          v: lastCleaning ? `${lastCleaning.date} ${lastCleaning.time}` : 'Keine Reinigungen',
          t: 's',
          s: { alignment: { horizontal: 'center' } }
        }
      ]);
    });

    // Add total row
    const totalTasks = Object.values(floors).reduce((sum, tasks) => sum + tasks.length, 0);
    summaryData.push([]);
    summaryData.push([
      { v: 'Gesamt', t: 's', s: { font: { bold: true } } },
      { v: totalTasks, t: 'n', s: { font: { bold: true }, alignment: { horizontal: 'center' } } },
      { v: '', t: 's' }
    ]);

    // Add monthly statistics
    summaryData.push([]);
    summaryData.push([{
      v: 'Monatliche Statistik',
      t: 's',
      s: { font: { bold: true, sz: 12 }, alignment: { horizontal: 'left' } }
    }]);

    // Headers for monthly stats
    summaryData.push([
      { v: 'Monat', t: 's', s: headerStyle },
      { v: 'Anzahl Reinigungen', t: 's', s: headerStyle }
    ]);

    // Group tasks by month
    const monthlyStats = sortedTasks.reduce((acc: { [key: string]: number }, task) => {
      const date = new Date(task.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    // Add monthly data
    Object.entries(monthlyStats)
      .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date descending
      .forEach(([monthKey, count]) => {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('de-DE', { month: 'long', year: 'numeric' });
        summaryData.push([
          { v: monthName, t: 's' },
          { v: count, t: 'n', s: { alignment: { horizontal: 'center' } } }
        ]);
      });

    // Create and add summary worksheet
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [
      { wch: 25 }, // Wohnbereich/Monat
      { wch: 20 }, // Anzahl Reinigungen
      { wch: 20 }  // Letzte Reinigung
    ];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Übersicht');

    // Write file with password protection and metadata
    XLSX.writeFile(wb, `${filename}.xlsx`, {
      bookSST: true,
      type: 'file',
      password: "Passwort123!",
      Props: {
        Title: "DRK Pflegeheim Reinigungsverlauf",
        Subject: "Reinigungsdokumentation",
        Author: "DRK Pflegeheim",
        Manager: "Benito Marconi",
        Company: "DRK Pflegeheim",
        Category: "Reinigungsdokumentation",
        Keywords: "Reinigung, Dokumentation, Hygiene",
        Comments: "Automatisch generierter Reinigungsverlauf",
        LastAuthor: "Hygiene Management System"
      }
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Fehler beim Exportieren der Daten. Bitte versuchen Sie es erneut.');
  }
}