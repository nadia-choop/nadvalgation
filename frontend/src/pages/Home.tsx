import LocationList from '../components/LocationList';

const HomePage = () => (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <center>
            <h1>Welcome!</h1>
        </center>
        
        <div style={{ marginTop: '2rem' }}>
            <h2>My Saved Locations</h2>
            <LocationList />
        </div>
    </div>
);

export default HomePage;