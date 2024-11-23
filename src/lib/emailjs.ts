import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init("-vX-Xu0v-kys4kH1Z");

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          // Smaller max size for better compression
          const maxSize = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Try multiple compression levels if needed
          let quality = 0.5;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let base64Size = dataUrl.length * 0.75;
          
          while (base64Size > 30000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            base64Size = dataUrl.length * 0.75;
          }
          
          resolve(dataUrl);
        } catch (error) {
          console.error('Image compression error:', error);
          reject(new Error('Fehler bei der Bildkomprimierung'));
        }
      };
      img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsDataURL(file);
  });
}

export async function sendNotificationEmail(params: {
  room_number: string;
  notes: string;
  images: File[];
  cleaning_types: string[];
  staff_name: string;
}): Promise<any> {
  try {
    let imageHtml = '';
    
    if (params.images.length > 0) {
      try {
        const compressed = await compressImage(params.images[0]);
        imageHtml = `<img src="${compressed}" style="max-width:400px;height:auto;margin:10px 0;" alt="Foto">`;
      } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Fehler bei der Bildverarbeitung. Bitte versuchen Sie es mit einem kleineren Bild.');
      }
    }

    const truncatedNotes = params.notes.length > 500 
      ? params.notes.substring(0, 497) + '...'
      : params.notes;

    const templateParams = {
      to_name: "Benito Marconi",
      to_email: "b.marconi@kv-vorderpfalz.drk.de",
      from_name: params.staff_name,
      room_number: params.room_number,
      cleaning_types: params.cleaning_types.join(', '),
      notes: truncatedNotes || 'Keine Notizen',
      image_html: imageHtml,
      date_time: new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const response = await emailjs.send(
      'service_2aqxvxr',
      'template_drk_hw',
      templateParams
    );
    
    return response;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.');
  }
}