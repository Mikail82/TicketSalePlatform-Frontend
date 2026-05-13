import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1533174000276-2617ea2a014a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');

  // SAYAÇ VE İNDİRİM STATE'LERİ
  const [timeLeft, setTimeLeft] = useState(300); // 300 saniye = 5 dakika
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  useEffect(() => {
    fetchSeats();
    const saved = localStorage.getItem('savedBanner');
    if (saved) {
      setBannerImage(saved);
    }
  }, []);

  const fetchSeats = () => {
    fetch('https://localhost:7003/api/venues/1/seats')
      .then(res => res.json())
      .then(data => setSeats(data));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setBannerImage(base64String);
        localStorage.setItem('savedBanner', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'Available') {
      if (selectedSeats.find(s => s.id === seat.id)) {
        setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
      } else {
        const hasSoldSeat = selectedSeats.some(s => s.status === 'Sold');
        if (hasSoldSeat) {
          setSelectedSeats([seat]);
        } else {
          setSelectedSeats([...selectedSeats, seat]);
        }
      }
    } else if (seat.status === 'Sold') {
      setSelectedSeats([seat]);
    }
  };

  const buyTickets = async () => {
    try {
      await Promise.all(selectedSeats.map(seat =>
        fetch('https://localhost:7003/api/tickets/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 1, eventId: 1, seatId: seat.id })
        })
      ));
      fetchSeats();
      setSelectedSeats([]);
      setAppliedDiscount(0); // Satın alınca indirimi sıfırla
      setDiscountCode('');
    } catch (error) {
      alert("Satın alma sırasında bir hata oluştu.");
    }
  };

  const cancelTicket = () => {
    const seatToCancel = selectedSeats[0];
    fetch('https://localhost:7003/api/tickets/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: seatToCancel.id
    }).then(() => { fetchSeats(); setSelectedSeats([]); });
  };

  // SEPETİ TEMİZLEME VE VAZGEÇME FONKSİYONU
  const clearSelection = () => {
    setSelectedSeats([]);
    setAppliedDiscount(0);
    setDiscountCode('');
    setTimeLeft(300);
  };

  // GERİ SAYIM SAYACI MANTIĞI
  useEffect(() => {
    if (selectedSeats.length > 0 && selectedSeats[0].status === 'Available') {
      if (timeLeft === 0) {
        alert("Rezervasyon süreniz doldu! Koltuklar başka kullanıcılar için boşa çıkarıldı.");
        setSelectedSeats([]);
        setAppliedDiscount(0);
        setTimeLeft(300);
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeLeft(300);
    }
  }, [selectedSeats, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // İNDİRİM KODU KONTROLÜ
  const handleApplyDiscount = () => {
    if (discountCode === 'YAZ20') {
      setAppliedDiscount(20);
      alert('Tebrikler! %20 İndirim uygulandı.');
    } else if (discountCode === 'REACT50') {
      setAppliedDiscount(50);
      alert('Tebrikler! Geliştirici Özel %50 İndirimi uygulandı.');
    } else {
      setAppliedDiscount(0);
      alert('Geçersiz indirim kodu!');
    }
  };

  const totalRevenue = seats.filter(s => s.status === 'Sold').reduce((acc, curr) => acc + curr.price, 0);
  const soldCount = seats.filter(s => s.status === 'Sold').length;
  const occupancyRate = seats.length > 0 ? ((soldCount / seats.length) * 100).toFixed(1) : 0;

  const groupSeatsByRow = () => {
    const grouped = {};
    seats.forEach(s => {
      if (!grouped[s.rowLetter]) grouped[s.rowLetter] = [];
      grouped[s.rowLetter].push(s);
    });
    return grouped;
  };

  const cartTotal = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);
  const cartSeatNames = selectedSeats.map(s => `${s.rowLetter}${s.seatNumber}`).join(', ');

  return (
    <div>
      {/* AFİŞ ALANI */}
      <div className="hero-banner" style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : {}}>
        <div className="admin-upload-btn">
          <label htmlFor="banner-upload" style={{ cursor: 'pointer' }}>📸 Afişi Değiştir</label>
          <input id="banner-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </div>
        <div className="hero-content">
          <h2 className="subtitle">İstanbul Flow360 Yaz Konserleri</h2>
          <h1 className="main-title">Blok3  </h1>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="dashboard">
        <div className="stat-card"><span className="stat-value">{totalRevenue} TL</span><span className="stat-label">Toplam Ciro</span></div>
        <div className="stat-card"><span className="stat-value">%{occupancyRate}</span><span className="stat-label">Doluluk Oranı</span></div>
        <div className="stat-card"><span className="stat-value">{seats.length - soldCount}</span><span className="stat-label">Boş Koltuk</span></div>
      </div>

      {/* SAHNE */}
      <div className="stage-container">
        <div className="stage-curve"></div>
        <div className="stage-text">SAHNE</div>
      </div>

      {/* KOLTUKLAR */}
      <div className="theater-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '150px' }}>
        {Object.keys(groupSeatsByRow()).map(row => (
          <div key={row} style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: '30px', color: '#475569', fontWeight: 'bold' }}>{row}</span>
            {groupSeatsByRow()[row].map(seat => (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                className={`seat ${seat.status === 'Available' ? 'available' : 'sold'} ${seat.category === 'VIP' ? 'vip' : ''} ${selectedSeats.find(s => s.id === seat.id) ? 'selected' : ''}`}
              >
                {seat.rowLetter}{seat.seatNumber}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* YENİ AKSİYON PANELİ (SAYAÇLI VE İNDİRİMLİ) */}
      {selectedSeats.length > 0 && (
        <div className="action-panel" style={{ position: 'relative' }}>

          {/*Yeni eklenen çarpı butonu*/}
          <button onClick={clearSelection} className="btn-close-panel" title="Seçimi Temizle">✖</button>


          {selectedSeats[0].status === 'Available' && (
            <div className={`neon-timer ${timeLeft <= 60 ? 'danger' : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}

          <div className="cart-info">
            <div style={{ fontSize: '16px', color: '#94a3b8' }}>
              Koltuklar: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{cartSeatNames}</span>
            </div>

            {selectedSeats[0].status === 'Available' && (
              <div className="discount-input-area">
                <input
                  type="text"
                  placeholder="İndirim Kodu"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="discount-input"
                />
                <button onClick={handleApplyDiscount} className="btn-apply">Uygula</button>
              </div>
            )}
          </div>

          <div className="price-breakdown">
            {appliedDiscount > 0 ? (
              <>
                <div className="original-price">{cartTotal} TL</div>
                <div className="discount-amount">İndirim (%{appliedDiscount}): -{(cartTotal * appliedDiscount) / 100} TL</div>
                <div className="final-price">{(cartTotal - (cartTotal * appliedDiscount) / 100)} TL</div>
              </>
            ) : (
              <div className="final-price">{cartTotal} TL</div>
            )}
          </div>

          {selectedSeats[0].status === 'Available' ? (
            <button onClick={buyTickets} className="btn-buy">💳 {selectedSeats.length} Bilet Al</button>
          ) : (
            <button onClick={cancelTicket} className="btn-cancel">❌ İptal Et</button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;