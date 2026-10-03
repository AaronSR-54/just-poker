import React from 'react';

interface TopBarProps {
  right?: React.ReactNode;
  dark?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ right, dark = true }) => {
  return (
    <div className={`jp-bar ${!dark ? 'bone' : ''}`}>
      <div className="brand">
        Just <em>Poker</em>
      </div>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        {right}
      </div>
    </div>
  );
};

export default TopBar;
