import { Module, Styles, Container, customModule, application, Panel } from '@ijstech/components';
import styleClass from './index.css';
import { updateNetworks } from './network';
export { Header } from './header';
export { Footer } from './footer';
import {match, MatchFunction, compile} from './pathToRegexp'
Styles.Theme.applyTheme(Styles.Theme.darkTheme);
interface IMenu{
	caption: string;
	url: string;
	module: string;
	params?: any;
	menus?: IMenu[];
	regex?: MatchFunction;
};
interface ILogo {
	header?: {
		desktop?: string;
		mobile?: string;
	};
	footer?: string;
};
interface ISCConfig{
	env: string;
	logo?: ILogo;
	moduleDir?: string;
	modules: {[name: string]: {path: string, dependencies: string[]}};
	dependencies?: {[name: string]: string};
	menus: IMenu[];
	routing: IRoute[];
	networks?: INetwork[];
	copyrightInfo: string;
	poweredBy?: string;
	version?: string;
};
interface INetwork {
	name: string,
	chainId: number,
	img: string,
	rpc: string,
	env: string,
	explorer: string
};
interface IRoute {
	url: string;
	module: string;
	default?: boolean;
	regex?: MatchFunction;
}
@customModule
export default class MainLauncher extends Module {
	private pnlMain: Panel;
	private menuItems: any[];
	private logo: string;
	private _options: ISCConfig;
	private currentModule: Module;

	constructor(parent?: Container, options?: any) {
		super(parent, options);
		this.classList.add(styleClass);
		this._options = options;
		let defaultRoute: IRoute | undefined = this._options.routing.find(route => route.default);
		if (defaultRoute && !location.hash) {
      const toPath = compile(defaultRoute.url, { encode: encodeURIComponent });
			location.hash = toPath();
		} else {
			this.handleHashChange()
		}
	};
	async init(){		
		window.onhashchange = this.handleHashChange.bind(this);
		this.menuItems = this.options.menus || [];
		this.logo = this.options.logo || "";
		updateNetworks(this.options);
		super.init();
	};
	hideCurrentModule(){
		if (this.currentModule)
			this.currentModule.style.display = 'none';
	}
	async getModuleByPath(path: string): Promise<Module>{
		let menu: IMenu | IRoute;
		let params: any;
		let list: Array<IMenu | IRoute> = [ ...this._options.routing, ...this._options.menus ];
		for (let i = 0; i < list.length; i ++){
			let item = list[i];
			if (item.url == path){
				menu = item;
				break;
			}
			else { 
				if (!item.regex)
					item.regex = match(item.url, { decode: decodeURIComponent })
					
				let _match = item.regex(path);
				if (_match !== false){
					menu = item;
					params = "params" in menu ? Object.assign({ ...menu.params }, _match.params) : _match.params;
					break;
				};
			};
		};
		if (menu){
			let menuObj: any = menu;
			if (!menuObj.moduleObject)
				menuObj.moduleObject = await application.loadModule(menu.module, this._options)
			if (menuObj.moduleObject) menuObj.moduleObject.onLoad(params);
			return menuObj.moduleObject;
		};
	};
	async handleHashChange(){
		let path = location.hash.split("?")[0];
		if (path.startsWith('#/'))
			path = path.substring(1);		
		let module = await this.getModuleByPath(path);
		if (module != this.currentModule)
			this.hideCurrentModule();
		this.currentModule = module;
		if (module){
			if (this.pnlMain.contains(module))
				module.style.display = 'initial';
			else
				this.pnlMain.append(module);
		};
	};
	async render() {
		return <i-vstack height="inherit">
			<main-header logo={this.options.logo?.header} id="headerElm" menuItems={this.menuItems} height="auto" width="100%"></main-header>
			<i-panel id="pnlMain" stack={{ grow: "1", shrink: "0" }} ></i-panel>
			<main-footer
				id="footerElm"
				stack={{ shrink: '0' }}
				class='footer'
				height="auto"
				width="100%"
				logo={this.options.logo?.footer}
				copyrightInfo={this._options.copyrightInfo}
				version={this._options.version}
				poweredBy={this._options.poweredBy}
			></main-footer>
		</i-vstack>
	};
};