export class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const requireRule = (condition, message = 'Access denied', status = 403) => { if (!condition) throw new ApiError(status, message); };
const manager = new Set(['assignDriver','reassignDriver','cancelJob','searchDrivers','resolveDispute','reviewDispute','approveDriver','rejectDriver','suspendDriver','updateDriverDocument','updateCustomer','publishRateCard','refundPayment','processPayout']);
const support = new Set(['assignDriver','reassignDriver','cancelJob','searchDrivers','reviewDispute','resolveDispute']);
const customer = new Set(['createQuote','bookDelivery','authorizePayment','cancelJob','searchDrivers','returnJobToSearching','createRating','createDispute','updateCustomer']);
const driver = new Set(['markDriverOnline','markDriverOffline','acceptDriverOffer','declineDriverOffer','updateJobStatus','addJobProof','returnJobToSearching','createDispute','updateDriverProfile','updateVehicle','submitDriverDocument','searchDrivers']);
export function authorizeCommand(user, state, method, args) {
  const admin = user.role.endsWith('_ADMIN');
  const allowed = user.role === 'MANAGER_ADMIN' ? manager : user.role === 'SUPPORT_ADMIN' ? support : user.role === 'CUSTOMER' ? customer : driver;
  requireRule(allowed.has(method), 'This operation is unavailable to your account');
  const id = user.profile_id;
  const jobId = ['authorizePayment','createRating','createDispute','addJobProof'].includes(method) ? args[0]?.jobId : args[0];
  const job = state.jobs.find(j => j.id === jobId);
  if (admin) {
    if(method==='cancelJob'){args[1]='ADMIN';args[2]=user.id;}
    if(method==='publishRateCard')args[1]=user.id;
    if(method==='updateDriverDocument')args[1]={...pick(args[1],['status','expiryDate','reviewNotes']),reviewedBy:user.id,reviewedAt:new Date()};
    if (method === 'resolveDispute' && user.role === 'SUPPORT_ADMIN') {
      requireRule(Number(args[2]?.refundAmount || 0) <= Number(process.env.SUPPORT_REFUND_LIMIT || 50), 'Support refund limit exceeded');
      requireRule(!args[2]?.driverDeduction, 'Driver deductions require Manager Admin');
    }
    return;
  }
  if (['acceptDriverOffer','declineDriverOffer'].includes(method)) requireRule(state.driverOffers.some(o => o.id === args[0] && o.driverId === id), 'Offer belongs to another driver');
  if (['updateDriverProfile','updateVehicle','submitDriverDocument','markDriverOnline','markDriverOffline','updateCustomer'].includes(method)) requireRule(args[0] === id, 'Profile belongs to another account');
  if (['cancelJob','searchDrivers','returnJobToSearching','updateJobStatus','authorizePayment','createRating','createDispute','addJobProof'].includes(method)) {
    requireRule(job && (user.role === 'CUSTOMER' ? job.customerId === id : job.driverId === id), 'Delivery belongs to another account');
  }
  if (method === 'updateCustomer') {
    args[1] = pick(args[1], ['name','email','phone','type','businessName','abn','savedAddresses','notificationsEnabled','deletionRequested']); args[2] = 'CUSTOMER';
  }
  if (method === 'updateDriverProfile') args[1] = pick(args[1], ['name','email','phone','abn','identityNumber','termsAccepted','bankName','accountNumber','bsb']);
  if (method === 'updateVehicle') args[1] = pick(args[1], ['type','make','model','year','plate','photoUrl']);
  if (method === 'updateJobStatus') {
    requireRule(['EN_ROUTE_TO_PICKUP','AT_PICKUP','PICKED_UP','EN_ROUTE_TO_DROPOFF','AT_DROPOFF','DELIVERED','COMPLETED'].includes(args[1]), 'Invalid driver transition', 400);
    args[2] = 'DRIVER'; args[3] = id;
  }
  if (method === 'cancelJob') { args[1] = 'CUSTOMER'; args[2] = id; }
  if (method === 'createRating') { args[0].raterId = id; args[0].raterType = 'CUSTOMER'; args[0].targetId = job.driverId; }
  if (method === 'createDispute') {requireRule(typeof args[0]?.description==='string'&&args[0].description.trim().length>=10,'Describe the issue in at least 10 characters',400);args[0] = pick(args[0], ['jobId','reason','description','customerPhotos']);}
  if (method === 'addJobProof') { requireRule(['pickup','delivery'].includes(args[0]?.type)&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(args[0]?.photoUrl||'')&&args[0].photoUrl.length<900000, 'Upload a handover photo smaller than 650 KB', 400); args[0] = pick(args[0], ['jobId','type','label','photoUrl','note']); }
}
export const pick = (object, fields) => Object.fromEntries(fields.filter(k => object?.[k] !== undefined).map(k => [k, object[k]]));
export function scopedState(user, state) {
  if (user.role.endsWith('_ADMIN')) return { ...state, demoSettings: undefined };
  const id = user.profile_id;
  const customer = user.role === 'CUSTOMER';
  const offers = state.driverOffers.filter(o => o.driverId === id);
  const jobs = state.jobs.filter(j => customer ? j.customerId === id : j.driverId === id || offers.some(o => o.jobId === j.id && o.status === 'PENDING' && o.expiresAt > new Date()));
  const jobIds = new Set(jobs.map(j => j.id));
  const drivers = state.drivers.filter(d => customer ? jobs.some(j => j.driverId === d.id) : d.id === id);
  return {
    customers: customer ? state.customers.filter(c => c.id === id) : [],
    drivers: customer ? drivers.map(d => pick(d, ['id','name','rating','approvalStatus',...(jobs.some(j=>j.driverId===d.id&&['ASSIGNED','EN_ROUTE_TO_PICKUP','AT_PICKUP','PICKED_UP','EN_ROUTE_TO_DROPOFF','AT_DROPOFF','DELIVERED'].includes(j.status))?['location']:[])])) : drivers,
    vehicles: state.vehicles.filter(v => drivers.some(d => d.id === v.driverId)).map(v => customer ? pick(v, ['id','driverId','type','make','model','plate']) : v),
    jobs: jobs.map(j => {
      if (!customer && j.driverId !== id) return { ...pick(j,['id','status','vehicleClass','timeOption','estimatedDistanceKm','estimatedDurationMinutes','createdAt','updatedAt']),pickupAddress:area(j.pickupAddress),dropoffAddress:area(j.dropoffAddress),customerId:'',price:0,driverEarnings:0 };
      const copy = { ...j }; delete copy.adminNotes; if (!customer) delete copy.recipientCode; return copy;
    }),
    jobItems: state.jobItems.filter(i => jobIds.has(i.jobId)),
    jobEvents: state.jobEvents.filter(e => jobIds.has(e.jobId) && jobs.some(j => j.id === e.jobId && (customer || j.driverId === id))),
    quotes: customer ? state.quotes.filter(q => q.customerId === id) : [],
    driverOffers: customer ? [] : offers,
    rateCards: state.rateCards,
    payments: customer ? state.payments.filter(p => jobIds.has(p.jobId)) : [],
    payouts: customer ? [] : state.payouts.filter(p => p.driverId === id),
    disputes: state.disputes.filter(d => jobIds.has(d.jobId) && (customer || jobs.some(j => j.id === d.jobId && j.driverId === id))),
    ratings: state.ratings.filter(r => jobIds.has(r.jobId)),
    notifications: state.notifications.filter(n => n.userId === user.id && (!customer || state.customers.find(c=>c.id===id)?.notificationsEnabled!==false)),
    driverDocuments: customer ? [] : state.driverDocuments.filter(d => d.driverId === id),
    jobProofs: state.jobProofs.filter(p => jobIds.has(p.jobId) && (customer || jobs.some(j => j.id === p.jobId && j.driverId === id))),
    auditLogs: [],
  };
}
const area = address => address.split(',').slice(1).join(',').trim() || 'Melbourne';
