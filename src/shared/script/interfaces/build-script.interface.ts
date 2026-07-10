export interface BuildScript {
  sourcePath?: string;
  targetPath?: string;
  port?: number;
  subDomain?: string;
  domain?: string;
  pm2path?: string;
  themeColor?: string;
  email?: string;
  hostDomain?: string;
  hostSubDomain?: string;
  shop?: string;
  needWww?: boolean;
  serverIp?: string;
  domainType?: 'sub-domain' | 'domain' | 'domain-http-www' | 'domain-www-http';
  oldDomain?: string;
  oldDomainType?:
    | 'sub-domain'
    | 'domain'
    | 'domain-http-www'
    | 'domain-www-http';
  isSsr?: boolean;
  buildType?: 'domain-change';
}

export interface UpdateBuildScript {
  sourcePath?: string;
  targetPath?: string;
  port?: number;
  domain?: string;
  shop?: string;
}

export interface ReBuildScript {
  targetPath?: string;
  domain?: string;
  shop?: string;
  apiBaseUrl?: string;
}

export interface DeleteBuildScript {
  targetPath?: string;
  subDomain?: string;
  domain?: string;
  hostDomain?: string;
  hostSubDomain?: string;
  needRemoveDomain?: boolean;
  isSsr?: boolean;
  domainType?: 'sub-domain' | 'domain' | 'domain-http-www' | 'domain-www-http';
}

export interface GitUpdateScript {
  targetPath?: string;
}

export interface GitUpdateAndBuildScript {
  targetPath?: string;
}
