import numpy as np, wave, sys
SR=44100; BPM=120; B=60/BPM; DUR=26.5
N=int(SR*DUR); out=np.zeros(N)
def add(sig,t,g=1.0):
    i=int(t*SR); j=min(N,i+len(sig)); out[i:j]+=sig[:j-i]*g
def env(n,a=.005,r=None):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)
    return e*np.exp(-t/(r if r else .2))
def f(m): return 440*2**((m-69)/12)
def kick():
    n=int(.35*SR);t=np.arange(n)/SR;fr=50+120*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*9)
def clap():
    n=int(.2*SR);t=np.arange(n)/SR;rng=np.random.default_rng(1);x=rng.standard_normal(n)
    x=np.convolve(x,[1,-1],'same');return x*np.exp(-t*25)*.5
def hat(o=False):
    n=int((.18 if o else .05)*SR);t=np.arange(n)/SR;x=np.random.default_rng(2).standard_normal(n)
    x=np.diff(np.r_[0,x]);return x*np.exp(-t*(15 if o else 70))*.25
def pluck(m,d=.25,g=1):
    n=int((d+.3)*SR);t=np.arange(n)/SR;fr=f(m)
    s=np.sign(np.sin(2*np.pi*fr*t))*.3+np.sin(2*np.pi*fr*t)+.3*np.sin(4*np.pi*fr*t)
    return s*env(n,.003,.12)*g
def bell(m,g=1):
    n=int(1.2*SR);t=np.arange(n)/SR;fr=f(m)
    s=np.sin(2*np.pi*fr*t)+.5*np.sin(2*np.pi*fr*2.76*t)*np.exp(-t*6)+.3*np.sin(2*np.pi*fr*5.4*t)*np.exp(-t*10)
    return s*env(n,.002,.45)*g
def bass(m,d):
    n=int(d*SR);t=np.arange(n)/SR;fr=f(m)
    s=np.sin(2*np.pi*fr*t)+.4*np.sin(4*np.pi*fr*t)
    e=np.minimum(1,t/.005)*np.minimum(1,(d-t)/.03);return s*e
def pad(ms,d):
    n=int(d*SR);t=np.arange(n)/SR;s=sum(np.sin(2*np.pi*f(m)*t*(1+dt))for m in ms for dt in(-.003,.003))
    e=np.minimum(1,t/.4)*np.minimum(1,(d-t)/.4);return s*e/len(ms)
def whoosh(d=.9):
    n=int(d*SR);t=np.arange(n)/SR;x=np.random.default_rng(3).standard_normal(n)
    k=np.ones(40)/40;x=np.convolve(x,k,'same');e=np.sin(np.pi*t/d)**2;return x*e*3
# chords D minor: Dm Bb C A  (2 bars each? 1 bar each = 2s)
prog=[(50,[62,65,69]),(46,[58,62,65]),(48,[60,64,67]),(45,[61,64,69])]
mel=[[74,77,81,77,74,72,74,69],[70,74,77,74,70,69,70,65],[72,76,79,76,72,71,72,67],[73,76,81,79,77,76,73,69]]
bars=int(DUR/(4*B))+1
for bar in range(bars):
    t0=bar*4*B; root,ch=prog[bar%4]
    intro = t0<4
    for b in range(4):
        tb=t0+b*B
        if tb>=DUR-.5:break
        add(kick(),tb,.9 if not intro or b==0 else .5)
        if b%2==1 and not intro: add(clap(),tb,.55)
        for h in range(2):
            if not intro or h==1: add(hat(h==1),tb+h*B/2,.5)
        # bass on 8ths, octave bounce
        for h in range(2): add(bass(root+(12 if h else 0)-12,B/2*.9),tb+h*B/2,.35)
    add(pad(ch,4*B),t0,.12)
    if t0>=4 and t0<DUR-1:
        for k,m in enumerate(mel[bar%4]): add(pluck(m,B/2,.22),t0+k*B/2)
# candle-lighting bells (s1: 1.0 + i*.25 ; s5: 22.7 + i*.125)
scale=[81,74,76,77,79,81,82,84,86]
for i,m in enumerate(scale): add(bell(m,.25),1.0+i*.25)
for i,m in enumerate(scale): add(bell(m,.18),22.7+i*.125)
for t in (7.85,12.85,17.85,21.85): add(whoosh(),t,.12)
for t in (10.5,11.0,11.5,15.3,15.75,16.2,16.65,9.0,14.0,18.9,19.15): add(bell(86,.15),t)
# fade out
fo=int(1.5*SR);out[-fo:]*=np.linspace(1,0,fo)
out=np.tanh(out*.9);out/=np.abs(out).max()*1.12
st=np.stack([out,out],1)
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype(np.int16).tobytes())
