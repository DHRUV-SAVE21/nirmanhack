from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
from twilio.rest import Client
from core.supabase_client import supabase

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard-stats")
async def get_dashboard_stats():
    """
    Fetch consolidated stats for the Admin Dashboard.
    """
    try:
        # 1. Total Farmers
        farmers_res = supabase.table("farmer_profiles").select("id", count="exact").execute()
        total_farmers = farmers_res.count if farmers_res.count is not None else 0
        
        # 2. Total Claims (from claim_applications)
        claims_res = supabase.table("claim_applications").select("id", count="exact").execute()
        total_claims = claims_res.count if claims_res.count is not None else 0
        
        # 3. Pending Approvals
        pending_res = supabase.table("claim_applications").select("id", count="exact").eq("status", "submitted").execute()
        pending_approvals = pending_res.count if pending_res.count is not None else 0
        
        # 4. Active Alerts / Risk Events (Keep existing or mock)
        alerts_res = supabase.table("risk_events").select("id", count="exact").in_("status", ["ACTIVE", "CLAIM_INITIATED"]).execute()
        active_alerts = alerts_res.count if alerts_res.count is not None else 0

        # 5. Disbursed Amount (Sum of approved_amount from completed/approved claims)
        # Using approved_amount
        disbursed_res = supabase.table("claim_applications")\
            .select("approved_amount")\
            .in_("status", ["approved", "completed"])\
            .execute()
            
        disbursed_amount = 0
        if disbursed_res.data:
            disbursed_amount = sum(float(item.get("approved_amount") or 0) for item in disbursed_res.data)
        
        # 5. Total Lands
        lands_res = supabase.table("lands").select("id", count="exact").execute()
        total_lands = lands_res.count if lands_res.count is not None else 0
        
        # 6. Pending Land Verifications
        pending_lands_res = supabase.table("lands").select("id", count="exact").eq("status", "PENDING").execute()
        pending_lands = pending_lands_res.count if pending_lands_res.count is not None else 0

        return {
            "total_farmers": total_farmers,
            "total_claims": total_claims,
            "total_lands": total_lands,
            "pending_approvals": pending_approvals,
            "pending_land_verifications": pending_lands,
            "active_alerts": active_alerts,
            "disbursed_amount": disbursed_display
        }

    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return {
            "total_farmers": 0,
            "total_claims": 0,
            "pending_approvals": 0,
            "active_alerts": 0,
            "disbursed_amount": "₹0"
        }

@router.get("/recent-claims")
async def get_recent_claims():
    """
    Fetch recently submitted claims from claim_applications table (limit 100).
    """
    try:
        # Fetch applications - Optimized select to avoid fetching heavy images
        response = supabase.table("claim_applications")\
            .select("id, farmer_name, scheme_name, crop_name, claim_amount, status, created_at")\
            .order("created_at", desc=True)\
            .limit(100)\
            .execute()
        
        claims = []
        for item in response.data:
            # Map fields safely
            farmer_name = item.get("farmer_name") or "Unknown Farmer"
            scheme = item.get("scheme_name") or "General Scheme"
            crop = item.get("crop_name")
            
            display_type = f"{scheme}"
            if crop:
               display_type += f" ({crop})"

            amount_val = item.get("claim_amount")
            amount = f"₹{amount_val:,.2f}" if amount_val is not None else "₹--"
            
            claims.append({
                "id": item.get("id"),
                "farmer": farmer_name,
                "type": display_type,
                "amount": amount,
                "date": item.get("created_at", "").split("T")[0],
                "status": item.get("status", "submitted")
            })
            
        return claims

    except Exception as e:
        print(f"Error fetching recent claims: {e}")
        return []

@router.get("/dashboard-chart")
async def get_dashboard_chart_data():
    """
    Get dynamic graph data for claims velocity from claim_applications.
    """
    try:
        from datetime import datetime, timedelta
        from collections import defaultdict

        # Calculate date range (last 7 days)
        today = datetime.now().date()
        date_labels = []
        for i in range(6, -1, -1):
            date_labels.append((today - timedelta(days=i)).isoformat())

        # Fetch claims created in last 7 days
        start_date = date_labels[0]
        
        # Claims (Submitted)
        claims_res = supabase.table("claim_applications")\
            .select("created_at")\
            .gte("created_at", start_date)\
            .execute()
            
        # Processed (Approved/Rejected)
        processed_res = supabase.table("claim_applications")\
            .select("updated_at")\
            .gte("updated_at", start_date)\
            .in_("status", ["approved", "rejected", "completed"])\
            .execute()

        # Aggregate counts
        claims_count = defaultdict(int)
        processed_count = defaultdict(int)

        if claims_res.data:
            for item in claims_res.data:
                date_str = item["created_at"].split("T")[0]
                claims_count[date_str] += 1
            
        if processed_res.data:
            for item in processed_res.data:
                date_str = item["updated_at"].split("T")[0]
                processed_count[date_str] += 1

        # Format for chart
        chart_data = []
        for date_str in date_labels:
            # Format label as "Mon", "Tue" etc.
            dt = datetime.fromisoformat(date_str)
            day_name = dt.strftime("%a") 
            
            chart_data.append({
                "name": day_name,
                "fullDate": date_str,
                "claims": claims_count[date_str],
                "processed": processed_count[date_str]
            })

        return chart_data

    except Exception as e:
        print(f"Error generating chart data: {e}")
        # Fallback
        return []

@router.get("/risk-heatmap")
async def get_risk_heatmap():
    """
    Get active risks for the heatmap/alert section.
    """
    try:
        response = supabase.table("risk_events")\
            .select("*")\
            .eq("status", "ACTIVE")\
            .order("created_at", desc=True)\
            .limit(5)\
            .execute()
            
        alerts = []
        for item in response.data:
            # Parse details safely
            details = item.get("details") or {}
            
            alerts.append({
                "id": item.get("id"),
                "type": item.get("risk_level", "Unknown Risk"),
                "location": details.get("location", "Unknown Region"),
                "message": details.get("description", "Potential crop risk detected.")
            })
            
        return alerts
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        return []

class BroadcastRequest(BaseModel):
    message: str
    region: str = "All"
    type: str = "General"
    channels: List[str] = ["sms"]

@router.post("/broadcast")
async def send_broadcast(request: BroadcastRequest):
    """
    Send broadcast message to farmers via Twilio.
    """
    try:
        # Fetch farmers
        query = supabase.table("farmer_profiles").select("phone, name, district")
        if request.region != "All":
            query = query.eq("district", request.region)
            
        result = query.execute()
        farmers = result.data if result.data else []
        
        sent_count = 0
        failed_count = 0
        
        # Twilio Setup (ENV vars needed: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_phone = os.getenv("TWILIO_PHONE_NUMBER")
        
        client = None
        if account_sid and auth_token and from_phone:
            try:
                client = Client(account_sid, auth_token)
            except Exception as e:
                print(f" Twilio Client Init Error: {e}")
        else:
            print(" Twilio credentials missing. Running in SIMULATION mode.")

        for farmer in farmers:
            phone = farmer.get("phone")
            name = farmer.get("name", "Farmer")
            body_text = f"[{request.type.upper()}] Let's Go Alert: {request.message}"

            if phone:
                if client:
                    try:
                        client.messages.create(
                            body=body_text,
                            from_=from_phone,
                            to=phone
                        )
                        sent_count += 1
                        print(f" SMS sent to {phone} ({name})")
                    except Exception as e:
                        print(f" Failed to send SMS to {phone}: {e}")
                        failed_count += 1
                else:
                    # Simulate
                    print(f" [SIMULATION] SMS to {phone} ({name}): {body_text}")
                    sent_count += 1
            else:
                failed_count += 1 # No phone provided in profile
                
        return {
            "status": "success", 
            "sent": sent_count, 
            "failed": failed_count,
            "total_targets": len(farmers),
            "message": "Broadcast sent successfully" if client else "Broadcast simulated (check console)"
        }

    except Exception as e:
        print(f"Error sending broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/crop-distribution")
async def get_crop_distribution():
    """
    Get claim count distributed by Crop Name.
    """
    try:
        claims = supabase.table("claim_applications").select("crop_name").execute()
        
        counts = {}
        for item in claims.data:
            crop = item.get("crop_name") or "Unknown"
            counts[crop] = counts.get(crop, 0) + 1
            
        data = [{"name": k, "value": v} for k, v in counts.items()]
        # Sort by value desc
        data.sort(key=lambda x: x["value"], reverse=True)
        return data[:10] # Top 10
    except Exception as e:
        print(f"Error fetching crop distribution: {e}")
        return []

@router.get("/reports/regional-impact")
async def get_regional_impact():
    """
    Get claim count distributed by Region (District).
    """
    try:
        # 1. Get all claims with user_id
        claims_res = supabase.table("claim_applications").select("user_id").execute()
        user_ids = [c["user_id"] for c in claims_res.data if c.get("user_id")]
        
        if not user_ids:
            return []

        # 2. Get profiles for these users to find district
        # Note: In a large system, this should be a DB View or Join. 
        # For now, fetching unique profiles is acceptable.
        unique_users = list(set(user_ids))
        profiles_res = supabase.table("farmer_profiles")\
            .select("user_id, district")\
            .in_("user_id", unique_users)\
            .execute()
            
        user_district_map = {p["user_id"]: p.get("district", "Unknown") for p in profiles_res.data}
        
        # 3. Aggregate
        counts = {}
        for uid in user_ids:
            dist = user_district_map.get(uid, "Unknown")
            counts[dist] = counts.get(dist, 0) + 1
            
        data = [{"name": k, "claims": v} for k, v in counts.items()]
        data.sort(key=lambda x: x["claims"], reverse=True)
        return data[:10]
    except Exception as e:
        print(f"Error fetching regional impact: {e}")
        return []

@router.get("/reports/monthly-claims")
async def get_monthly_claims():
    """
    Get monthly breakdown of claims by status (Approved, Pending, Rejected).
    """
    try:
        from datetime import datetime
        current_year = datetime.now().year
        
        # Fetch all claims for current year (simplified)
        claims_res = supabase.table("claim_applications")\
            .select("created_at, status")\
            .execute()
            
        # Initialize monthly buckets
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        data_map = {m: {"name": m, "approved": 0, "pending": 0, "rejected": 0} for m in months}
        
        for item in claims_res.data:
            created_at = item.get("created_at")
            if not created_at:
                continue
                
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            if dt.year == current_year:
                m_idx = dt.month - 1
                m_name = months[m_idx]
                
                status = (item.get("status") or "submitted").lower()
                
                if status in ["approved", "completed"]:
                    data_map[m_name]["approved"] += 1
                elif status in ["rejected"]:
                    data_map[m_name]["rejected"] += 1
                else:
                    data_map[m_name]["pending"] += 1
                    
        return list(data_map.values())
    except Exception as e:
        print(f"Error fetching monthly claims: {e}")
        return []

@router.get("/reports/land-registrations")
async def get_land_registration_report():
    """
    Get breakdown of land registrations by status.
    """
    try:
        lands = supabase.table("lands").select("status").execute()
        
        counts = {}
        for item in lands.data:
            s = item.get("status") or "PENDING"
            counts[s] = counts.get(s, 0) + 1
            
        data = [{"name": k, "value": v} for k, v in counts.items()]
        return data
    except Exception as e:
        print(f"Error fetching land report: {e}")
        return []
