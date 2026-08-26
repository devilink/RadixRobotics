export default function Lab3DPage() {
  return (
    <div className="w-full h-[100dvh] bg-black m-0 p-0 overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full relative">
        <iframe 
          title="School Lab" 
          frameBorder="0" 
          allowFullScreen 
          allow="autoplay; fullscreen; xr-spatial-tracking" 
          src="https://sketchfab.com/models/a97f74bfd83644858af7216f794504b6/embed"
          className="absolute inset-0 w-full h-full border-none"
        />
      </div>
      <div className="bg-zinc-950 p-1.5 sm:p-2 text-center border-t border-zinc-900 pb-safe">
        <p className="text-[11px] sm:text-[13px] font-normal m-1 text-[#4A4A4A] truncate px-2">
          <a href="https://sketchfab.com/3d-models/school-lab-a97f74bfd83644858af7216f794504b6?utm_medium=embed&utm_campaign=share-popup&utm_content=a97f74bfd83644858af7216f794504b6" target="_blank" rel="nofollow" className="font-bold text-[#1CAAD9]">School Lab</a> by{' '}
          <a href="https://sketchfab.com/mostafaebrahiem1998?utm_medium=embed&utm_campaign=share-popup&utm_content=a97f74bfd83644858af7216f794504b6" target="_blank" rel="nofollow" className="font-bold text-[#1CAAD9]">Mostafa Ebrahim</a> on{' '}
          <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=a97f74bfd83644858af7216f794504b6" target="_blank" rel="nofollow" className="font-bold text-[#1CAAD9]">Sketchfab</a>
        </p>
      </div>
    </div>
  );
}
