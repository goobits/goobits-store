<script lang="ts">
	import ShopIndexPage from './ShopIndexPage.svelte'
	import ShopProductPage from './ShopProductPage.svelte'
	import ShopCategoryPage from './ShopCategoryPage.svelte'
	import ShopCollectionPage from './ShopCollectionPage.svelte'
	import ShopAccountPage from './ShopAccountPage.svelte'
	import ShopCartPage from './ShopCartPage.svelte'
	import ShopCheckoutPage from './ShopCheckoutPage.svelte'
	import ShopLoginPage from './ShopLoginPage.svelte'
	import ShopPlansPage from './ShopPlansPage.svelte'
	import type { Readable } from 'svelte/store'

	type PageType = 'index' | 'product' | 'category' | 'collection' | 'account' | 'cart' | 'checkout' | 'login' | 'register' | 'plans'

	interface AuthStore {
		subscribe: Readable<AuthState>['subscribe'];
		login: (email: string, password: string) => Promise<{ success: boolean; mfaRequired?: boolean }>;
		logout: () => Promise<void>;
		register: (data: Record<string, unknown>) => Promise<{ success: boolean }>;
		checkSession: () => Promise<void>;
		clearError?: () => void;
		updateProfile?: (data: Record<string, unknown>) => Promise<{ success: boolean }>;
	}

	interface DemoCredentials {
		email: string;
		password: string;
	}

	interface Branding {
		siteName?: string;
		loginTitle?: string;
		loginSubtitle?: string;
		registerTitle?: string;
		registerSubtitle?: string;
	}

	interface PageData {
		pageType?: PageType;
		products?: MedusaProduct[];
		product?: MedusaProduct;
		cart?: MedusaCart;
		regions?: MedusaRegion[];
		auth?: AuthStore;
		isAuthenticated?: Readable<boolean>;
		customer?: Readable<MedusaCustomer | null>;
		form?: Record<string, unknown>;
		demoCredentials?: DemoCredentials;
		[key: string]: unknown;
	}

	interface ContentConfig {
		hero?: HeroSection;
		features?: FeaturesSection;
		footer?: FooterSection;
		branding?: Branding;
		plans?: {
			title: string;
			description: string;
			links: Array<{ url: string; label: string }>;
		};
	}

	interface Props {
		data: PageData;
		content?: ContentConfig;
		config?: ShopConfig;
	}

	const {
		data,
		content = {},
		config = {}
	}: Props = $props()

	// Extract page type and route data
	const pageType: PageType = $derived((data.pageType || 'index') as PageType)
</script>

<div class="shop-router">
	{#if pageType === 'index'}
		<ShopIndexPage
			{data}
			hero={content.hero}
			features={content.features}
			footer={content.footer}
			{config}
		/>
	{:else if pageType === 'product'}
		<ShopProductPage {data} />
	{:else if pageType === 'category'}
		<ShopCategoryPage {data} />
	{:else if pageType === 'collection'}
		<ShopCollectionPage {data} />
	{:else if pageType === 'account'}
		<ShopAccountPage
			{data}
			auth={data.auth}
			isAuthenticated={data.isAuthenticated}
			customer={data.customer}
			branding={content.branding}
		/>
	{:else if pageType === 'cart'}
		<ShopCartPage {data} {config} />
	{:else if pageType === 'checkout'}
		<ShopCheckoutPage {data} form={data.form} />
	{:else if pageType === 'login'}
		<ShopLoginPage
			{data}
			auth={data.auth}
			demoCredentials={data.demoCredentials}
			initialMode="login"
			branding={content.branding}
		/>
	{:else if pageType === 'register'}
		<ShopLoginPage
			{data}
			auth={data.auth}
			demoCredentials={null}
			initialMode="register"
			branding={content.branding}
		/>
	{:else if pageType === 'plans'}
		<ShopPlansPage
			{data}
			content={content.plans}
		/>
	{:else}
		<div class="shop-error">
			<h1>Page Not Found</h1>
			<p>The requested shop page could not be found.</p>
			<a href="/shop">← Back to Shop</a>
		</div>
	{/if}
</div>

<style>
	.shop-router {
		display: flex;
		flex-direction: column;
		flex: 1;
		width: 100%;
	}

	.shop-error {
		text-align: center;
		padding: 2rem;
	}

	.shop-error h1 {
		color: var(--color-text-primary, #1a1a1a);
		margin-bottom: 1rem;
	}

	.shop-error p {
		color: var(--color-text-secondary, #666);
		margin-bottom: 1.5rem;
	}

	.shop-error a {
		color: var(--color-primary, #f59e0b);
		text-decoration: none;
	}

	.shop-error a:hover {
		text-decoration: underline;
	}
</style>
