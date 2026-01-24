import {Minus, Square, SquaresExclude, X} from 'lucide-react';
import type React from 'react';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/animate-ui/components/buttons/button.tsx';

function WindowFrame({children}: { children: React.ReactNode }) {
	const [isMaximized, setIsMaximized] = useState(false);

	const {t} = useTranslation();
	const [platform, setPlatform] = useState<'darwin' | 'win32' | 'linux'>('win32');

	useEffect(() => {
		window.electronAPI.isMaximized().then(setIsMaximized);
		window.electronAPI.onWindowMaximized(setIsMaximized);
		window.electronAPI.platform().then(setPlatform);
	}, []);

	const closeWindow = () => {
		window.electronAPI.closeWindow();
	};

	const maximizeWindow = () => {
		window.electronAPI.maximizeWindow();
	};

	const minimizeWindow = () => {
		window.electronAPI.minimizeWindow();
	};

	const restoreWindow = () => {
		window.electronAPI.restoreWindow();
	};

	return (
		<div
			className={`border-4 border-primary w-dvw h-dvh shadow-xl window-${platform} ${isMaximized ? 'maximized' : ''}`}
		>
			<div className="h-10 w-full relative window-top-bar flex items-center px-4">
				<h1 className="font-light text-lg inline">{t('Inventory Manager')}</h1>
				<div className="window-controls">
					<div className="before"></div>
					<Button
						type="button"
						className="control minimize"
						onClick={minimizeWindow}
					>
						<Minus/>
					</Button>
					<Button
						type="button"
						className="control maximize"
						onClick={isMaximized ? restoreWindow : maximizeWindow}
					>
						{isMaximized ? <SquaresExclude/> : <Square/>}
					</Button>
					<Button type="button" className="control close" onClick={closeWindow}>
						<X/>
					</Button>
					<div className="after"></div>
				</div>
			</div>
			<div className="window-content">{children}</div>
		</div>
	);
}

export default WindowFrame;
