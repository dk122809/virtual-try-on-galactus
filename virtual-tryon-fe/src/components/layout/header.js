import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';

function Header() {

    return (
        <AppBar position="static" className='header'>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <img
                        src={`/images/logo.png`}
                        width="150"
                    />
                </Toolbar>
            </Container>
        </AppBar>
    );
}
export default Header;
