import React from 'react';

export default function Background() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      {/* dot grid */}
      <svg width="100%" height="100%" style={{position:'absolute',inset:0,opacity:0.3}}>
        <defs>
          <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="rgba(255,255,255,0.15)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* top-left corner bracket */}
      <svg width="320" height="320" style={{position:'absolute',top:0,left:0,opacity:0.06}}>
        <path d="M0 80 L0 0 L80 0" fill="none" stroke="var(--a1)" strokeWidth="1"/>
        <path d="M0 160 L0 0 L160 0" fill="none" stroke="var(--a1)" strokeWidth="0.5"/>
      </svg>

      {/* bottom-right bracket */}
      <svg width="320" height="320" style={{position:'absolute',bottom:0,right:0,opacity:0.06}}>
        <path d="M320 240 L320 320 L240 320" fill="none" stroke="var(--cyan)" strokeWidth="1"/>
        <path d="M320 160 L320 320 L160 320" fill="none" stroke="var(--cyan)" strokeWidth="0.5"/>
      </svg>

      {/* ambient orb — top center */}
      <div style={{
        position:'absolute',top:'15%',left:'50%',transform:'translate(-50%,-50%)',
        width:'700px',height:'350px',borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(240,180,41,0.05) 0%, transparent 70%)',
        filter:'blur(60px)',
        animation:'floatOrb 20s ease-in-out infinite',
      }}/>

      {/* ambient orb — bottom left */}
      <div style={{
        position:'absolute',bottom:'10%',left:'15%',
        width:'500px',height:'300px',borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(0,212,255,0.03) 0%, transparent 70%)',
        filter:'blur(50px)',
        animation:'floatOrb 25s ease-in-out infinite reverse',
      }}/>

      {/* ambient orb — right */}
      <div style={{
        position:'absolute',top:'50%',right:'5%',
        width:'400px',height:'400px',borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(0,232,135,0.025) 0%, transparent 70%)',
        filter:'blur(50px)',
        animation:'floatOrb 18s ease-in-out infinite 5s',
      }}/>

      {/* scanline */}
      <div style={{
        position:'absolute',left:0,right:0,height:'1px',
        background:'linear-gradient(90deg,transparent,rgba(240,180,41,0.12),transparent)',
        animation:'scanline 14s linear infinite',
      }}/>
    </div>
  );
}
